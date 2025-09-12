import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

import { LoginSchema } from './lib/validations/auth';

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        // Only validate the schema here, actual authentication happens in signIn callback
        const validatedFields = LoginSchema.safeParse(credentials);
        
        if (validatedFields.success) {
          // Return the credentials to pass to signIn callback
          return {
            id: 'temp',
            email: validatedFields.data.email,
            password: validatedFields.data.password,
          };
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
