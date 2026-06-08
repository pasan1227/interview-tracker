import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Valid email is required' })
  .max(254, { message: 'Email is too long' });

const name = z.string().trim().min(1, { message: 'Name is required' }).max(120);

// 72 = bcrypt input limit. Going higher is silently truncated by bcrypt.
const password = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(72);

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, { message: 'Password is required' }).max(72),
  code: z.optional(z.string().length(6).regex(/^\d{6}$/)),
});

export const RegisterSchema = z.object({ name, email, password });

export const ResetSchema = z.object({ email });

export const NewPasswordSchema = z.object({ password });

// Profile self-edit schema. PR 13: only the signed-in user can hit this
// path now (no admin-edits-any-user path post-multitenant), so email/role
// fields are gone — the account-takeover surface they brought went with
// them.
export const UpdateUserSchema = z
  .object({
    name: name.optional(),
    currentPassword: z.string().min(1).max(72).optional(),
    newPassword: password.optional(),
  })
  .strict();

export type UpdateUserActionInput = z.input<typeof UpdateUserSchema>;
