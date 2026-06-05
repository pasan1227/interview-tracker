import { UserRole } from '@/lib/generated/prisma/browser';
import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Valid email is required' })
  .max(254, { message: 'Email is too long' });

const name = z.string().trim().min(1, { message: 'Name is required' }).max(120);

// 72 = bcrypt input limit. Going higher is silently truncated by bcrypt.
const password = z.string().min(8, { message: 'Password must be at least 8 characters' }).max(72);

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, { message: 'Password is required' }).max(72),
  code: z.optional(z.string().length(6).regex(/^\d{6}$/)),
});

export const RegisterSchema = z.object({ name, email, password });

export const ResetSchema = z.object({ email });

export const NewPasswordSchema = z.object({ password });

// Admin user-management (settings/users) — creating a new account.
export const AdminCreateUserSchema = z.object({
  name,
  email,
  password,
  role: z.nativeEnum(UserRole).optional(),
});

// Unified update schema accepting the superset of fields. The action enforces
// per-role/per-self rules: non-admins can't touch email/role, and anyone
// changing their own password must supply currentPassword. Schema-level
// refinement would have to inspect the actor — keep that on the server.
export const UpdateUserSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    role: z.nativeEnum(UserRole).optional(),
    currentPassword: z.string().min(1).max(72).optional(),
    newPassword: password.optional(),
  })
  .strict();

export type AdminCreateUserInput = z.input<typeof AdminCreateUserSchema>;
export type UpdateUserActionInput = z.input<typeof UpdateUserSchema>;
