import type { NextAuthConfig } from 'next-auth';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { env } from './lib/env';

// This config is shared with the edge-runtime middleware. It must NOT
// pull in Prisma, bcrypt, or any node-only dependency. The full auth.ts
// re-uses this config and layers on the credentials provider, adapter,
// and the JWT/session callbacks that DO need Prisma.
//
// The session callback here is intentionally minimal: it copies the
// org slice from the JWT (already populated by auth.ts's jwt callback
// at sign-in time) onto session.user so the middleware can read
// req.auth.user.activeOrgId without any DB roundtrip.
export default {
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        // The full session() callback in auth.ts handles role/email/
        // 2FA refresh. This edge version just exposes the org slice
        // (no DB calls).
        session.user.activeOrgId =
          (token.activeOrgId as string | null | undefined) ?? null;
        session.user.activeOrgSlug =
          (token.activeOrgSlug as string | null | undefined) ?? null;
        // Cast through unknown to avoid duplicating the JWT/session
        // type augmentation here.
        session.user.activeOrgRole =
          (token.activeOrgRole as unknown as typeof session.user.activeOrgRole) ?? null;
        session.user.orgs =
          (token.orgs as unknown as typeof session.user.orgs) ?? [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
