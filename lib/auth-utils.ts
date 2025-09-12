import { getUserByEmail } from '@/data/user';
import { LoginSchema } from '@/lib/validations/auth';
import * as z from 'zod';

export async function validateCredentials(credentials: z.infer<typeof LoginSchema>) {
  const { email, password } = credentials;
  
  try {
    const user = await getUserByEmail(email);
    
    // If user doesn't exist or doesn't have a password (OAuth users)
    if (!user || !user.password) {
      return null;
    }
    
    // Use dynamic import to load bcryptjs only in Node.js runtime
    let bcrypt;
    try {
      bcrypt = await import('bcryptjs');
    } catch (importError) {
      console.error('Failed to import bcryptjs:', importError);
      return null;
    }
    
    const passwordMatch = await bcrypt.default.compare(password, user.password);
    
    if (passwordMatch) {
      // Return user data that NextAuth expects
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error validating credentials:', error);
    return null;
  }
}