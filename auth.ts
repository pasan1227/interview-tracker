import authConfig from '@/auth.config';
import { db } from '@/lib/db';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getAccountByUserId } from './data/account';
import { getTwoFactorConfirmationByUserId } from './data/two-factor-confirmation';
import { getUserById, getUserByEmail } from './data/user';
import { UserRole } from './lib/generated/prisma/client';
import { LoginSchema } from './lib/validations/auth';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
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

      // OAuth path: refuse linking if a credentials user already exists for
      // this email but hasn't verified — prevents account takeover.
      if (user.email) {
        const existing = await getUserByEmail(user.email);
        if (existing?.password && !existing.emailVerified) return false;
      }
      return true;
    },
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.role) session.user.role = token.role as UserRole;
        session.user.isTwoFactorEnabled = Boolean(token.isTwoFactorEnabled);
        session.user.isOAuth = Boolean(token.isOAuth);
        session.user.name = token.name;
        session.user.email = token.email as string;
      }
      return session;
    },
    async jwt({ token, trigger }) {
      if (!token.sub) return token;

      // Reuse cached claims for steady-state requests; refresh only on
      // sign-in, explicit session update, or first JWT creation.
      const needsRefresh =
        trigger === 'signIn' || trigger === 'update' || !token.role;
      if (!needsRefresh) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(existingUser.id);
      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token;
    },
  },
});
