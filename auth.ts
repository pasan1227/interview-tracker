import authConfig from '@/auth.config';

import { db } from '@/lib/db';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import { getAccountByUserId } from './data/account';
import { getTwoFactorConfirmationByUserId } from './data/two-factor-confirmation';
import { getUserById, getUserByEmail } from './data/user';
import { UserRole } from './lib/generated/prisma';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: '/login',
    error: '/error',
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          emailVerified: new Date(),
        },
      });
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') return true;
      
      // For credentials provider, user contains email and password from auth.config.ts
      if (user.email && (user as any).password) {
        try {
          const bcrypt = await import('bcryptjs');
          const existingUser = await getUserByEmail(user.email);
          
          if (!existingUser || !existingUser.password) return false;
          
          const passwordMatch = await bcrypt.default.compare((user as any).password, existingUser.password);
          
          if (!passwordMatch) return false;
          
          if (!existingUser.emailVerified) return false;

          if (existingUser.isTwoFactorEnabled) {
            const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
              existingUser.id
            );

            if (!twoFactorConfirmation) {
              return false;
            }
            // Delete two factor confirmation for next sign in
            await db.twoFactorConfirmation.delete({
              where: {
                id: twoFactorConfirmation.id,
              },
            });
          }
          
          // Update user object with real user data
          user.id = existingUser.id;
          user.name = existingUser.name;
          user.email = existingUser.email;
          (user as any).role = existingUser.role;
          (user as any).isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
          
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      
      return false;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (token.isTwoFactorEnabled && session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.isOAuth = token.isOAuth as boolean;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

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
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
});
