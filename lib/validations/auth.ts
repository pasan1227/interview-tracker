import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Valid email is required' })
  .max(254, { message: 'Email is too long' });

// 72 = bcrypt input limit. Going higher is silently truncated by bcrypt.
const password = z.string().min(8, { message: 'Password must be at least 8 characters' }).max(72);

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, { message: 'Password is required' }).max(72),
  code: z.optional(z.string().length(6).regex(/^\d{6}$/)),
});

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, { message: 'Name is required' }).max(120),
  email,
  password,
});

export const ResetSchema = z.object({ email });

export const NewPasswordSchema = z.object({ password });
