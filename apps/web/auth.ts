import authConfig from '@/auth.config';
import { db } from '@/lib/db';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getAccountByUserId } from './data/account';
import { getActiveMembershipsForUser, getMembership } from './data/membership';
import { getTwoFactorConfirmationByUserId } from './data/two-factor-confirmation';
import { getUserById, getUserByEmail } from './data/user';
import { MembershipStatus, OrganizationRole } from '@/lib/generated/prisma/enums';
import { LoginSchema } from './lib/validations/auth';
import type { ExtendedUser } from './next-auth.d';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  unstable_update,
} = NextAuth({
  ...authConfig,
  pages: {
    signIn: '/login',
    error: '/error',
  },
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials) {
        const validated = LoginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;
        const user = await getUserByEmail(email);
        if (!user?.password) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        if (!user.emailVerified) return null;

        if (user.isTwoFactorEnabled) {
          const confirmation = await getTwoFactorConfirmationByUserId(user.id);
          if (!confirmation) return null;
          await db.twoFactorConfirmation.delete({
            where: { id: confirmation.id },
          });
        }

        return user;
      },
    }),
  ],
  events: {
    async linkAccount({ user, account }) {
      // Only auto-verify when the provider itself verified the email.
      // GitHub may return unverified emails; Google's profile email is verified by default.
      if (account.provider !== 'google') return;
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Credentials path is fully validated in authorize().
      if (account?.provider === 'credentials') return true;

      // OAuth path:
      // 1. Refuse linking if a credentials user already exists for this
      //    email but hasn't verified — prevents account takeover.
      // 2. PR 12: signup is invite-only. A brand-new OAuth login is
      //    only allowed if there's a pending invitation for the email
      //    (i.e. the user clicked their invite link and chose "Sign in
      //    with Google"). Without an invitation OR an existing user
      //    row, reject — there's no path to bootstrap an org in v1.
      if (user.email) {
        const existing = await getUserByEmail(user.email);
        if (existing?.password && !existing.emailVerified) return false;
        if (!existing) {
          const invitation = await db.invitation.findFirst({
            where: {
              email: user.email.toLowerCase(),
              acceptedAt: null,
              expires: { gt: new Date() },
            },
            select: { id: true },
          });
          if (!invitation) return false;
        }
      }
      return true;
    },
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        session.user.isTwoFactorEnabled = Boolean(token.isTwoFactorEnabled);
        session.user.isOAuth = Boolean(token.isOAuth);
        session.user.isPlatformAdmin = Boolean(token.isPlatformAdmin);
        session.user.name = token.name;
        session.user.email = token.email as string;
        // Active organization slice. middleware.ts redirects logged-in
        // users with activeOrgId === null to /select-org. Cast through
        // `as` because the JWT type augmentation widens the field shape
        // here under `interface JWT` merging.
        session.user.activeOrgId =
          (token.activeOrgId as string | null | undefined) ?? null;
        session.user.activeOrgSlug =
          (token.activeOrgSlug as string | null | undefined) ?? null;
        session.user.activeOrgRole =
          (token.activeOrgRole as ExtendedUser['activeOrgRole']) ?? null;
        session.user.orgs = (token.orgs as ExtendedUser['orgs']) ?? [];
      }
      return session;
    },
    async jwt({ token, trigger, session: updatePayload }) {
      if (!token.sub) return token;

      // Always confirm the underlying user still exists. The lookup is
      // an indexed point query — adds <1ms per request — and is the only
      // way to revoke a JWT after deleteUser(). Returning an identity-
      // less token effectively logs the holder out on the next request;
      // session() below only writes user fields when token.sub is set.
      const existingUser = await getUserById(token.sub);
      if (!existingUser) {
        return {};
      }

      // Org-switching path. The client calls update({ activeOrgId })
      // via NextAuth's useSession().update or unstable_update on the
      // server. We accept it only after re-verifying membership — the
      // payload is untrusted input.
      if (
        trigger === 'update' &&
        updatePayload &&
        typeof updatePayload === 'object' &&
        'activeOrgId' in updatePayload &&
        typeof (updatePayload as { activeOrgId?: unknown }).activeOrgId === 'string'
      ) {
        const requestedOrgId = (updatePayload as { activeOrgId: string }).activeOrgId;
        const membership = await getMembership(existingUser.id, requestedOrgId);
        if (
          membership &&
          membership.status === MembershipStatus.ACTIVE &&
          !membership.organization.deletedAt
        ) {
          token.activeOrgId = requestedOrgId;
          token.activeOrgSlug = membership.organization.slug;
          token.activeOrgRole = membership.role;
        }
        // Fall through to refresh below regardless of accept/reject.
      }

      // Refresh name / email / 2FA / OAuth + org slice claims on
      // sign-in, explicit session update, or first JWT creation.
      // The existence-check above runs every request — the heavier
      // refresh only when something has actually changed.
      const needsRefresh =
        trigger === 'signIn' ||
        trigger === 'update' ||
        token.isPlatformAdmin === undefined;
      if (!needsRefresh) return token;

      const existingAccount = await getAccountByUserId(existingUser.id);
      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
      token.isPlatformAdmin = existingUser.isPlatformAdmin;

      // Refresh the org list so a freshly-added Membership shows up
      // in the switcher without a re-login.
      const orgs = await getActiveMembershipsForUser(existingUser.id);
      token.orgs = orgs;

      // Decide / re-validate activeOrgId. Three cases:
      //   - user belongs to exactly one org → auto-select.
      //   - user's existing activeOrgId is still valid → keep it.
      //   - otherwise (zero orgs, or activeOrg revoked) → null, and
      //     middleware routes them to /select-org or /no-access.
      if (token.activeOrgId) {
        const stillMember = orgs.find((o) => o.id === token.activeOrgId);
        if (stillMember) {
          token.activeOrgSlug = stillMember.slug;
          token.activeOrgRole = stillMember.role;
        } else {
          token.activeOrgId = null;
          token.activeOrgSlug = null;
          token.activeOrgRole = null;
        }
      }
      if (!token.activeOrgId && orgs.length === 1) {
        token.activeOrgId = orgs[0].id;
        token.activeOrgSlug = orgs[0].slug;
        token.activeOrgRole = orgs[0].role;
      }
      if (!token.activeOrgId) {
        token.activeOrgId = null;
        token.activeOrgSlug = null;
        token.activeOrgRole = null;
      }
      // Default for users that haven't been ported yet (e.g. test
      // fixtures missing the field).
      if (token.isPlatformAdmin === undefined) token.isPlatformAdmin = false;
      // Suppress unused-import warning under strict tsc.
      void OrganizationRole;

      return token;
    },
  },
});
