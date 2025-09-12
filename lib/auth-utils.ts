import { getUserByEmail } from '@/data/user';
import { LoginSchema } from '@/lib/validations/auth';
import * as z from 'zod';

export async function validateCredentials(credentials: z.infer<typeof LoginSchema>) {
  const { email, password } = credentials;
  
  const user = await getUserByEmail(email);
  
  if (!user || !user.password) {
    return null;
  }
  
  // Use dynamic import to load bcryptjs only in Node.js runtime
  const bcrypt = await import('bcryptjs');
  const passwordMatch = await bcrypt.default.compare(password, user.password);
  
  if (passwordMatch) {
    return user;
  }
  
  return null;
}