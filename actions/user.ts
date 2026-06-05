'use server';

import { generateVerificationToken } from '@/data/tokens';
import {
  adminUpdateUser as adminUpdateUserData,
  createUser as createUserData,
  deleteUser as deleteUserData,
  getSafeUserById,
  getUserByEmail,
  getUserPasswordHash,
  updateUser as updateUserData,
  type AdminUpdateUserInput,
  type UpdateUserInput,
} from '@/data/user';
import { AuthzError, isAdmin, requireSession } from '@/lib/authz';
import { sendVerificationEmail } from '@/lib/mail';
import {
  AdminCreateUserSchema,
  UpdateUserSchema,
  type AdminCreateUserInput,
  type UpdateUserActionInput,
} from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createUser(input: AdminCreateUserInput) {
  const actor = await requireSession();
  if (!isAdmin(actor)) throw new AuthzError('Forbidden');

  const data = AdminCreateUserSchema.parse(input);

  const existing = await getUserByEmail(data.email);
  if (existing) throw new Error('A user with that email already exists');

  const user = await createUserData(data);
  revalidatePath('/dashboard/settings/users');
  return user;
}

export async function updateUser(id: string, input: UpdateUserActionInput) {
  const actor = await requireSession();
  const isSelf = actor.id === id;
  const isAdminActor = isAdmin(actor);

  if (!isAdminActor && !isSelf) throw new AuthzError('Forbidden');

  const data = UpdateUserSchema.parse(input);

  // Non-admins can only update their own name/password — never email/role.
  if (!isAdminActor && (data.email !== undefined || data.role !== undefined)) {
    throw new AuthzError('Forbidden');
  }

  // Anyone changing their OWN password (including admins) must prove the
  // current one. Defeats account takeover from a stolen session.
  if (isSelf && data.newPassword) {
    if (!data.currentPassword) {
      throw new AuthzError('Current password is required to set a new one');
    }
    const hash = await getUserPasswordHash(id);
    if (!hash) throw new AuthzError('Cannot change password for this account');
    const ok = await bcrypt.compare(data.currentPassword, hash);
    if (!ok) throw new AuthzError('Current password is incorrect');
  }

  // Email changes go through the admin path only. Clear emailVerified and
  // send a fresh verification token so a stolen-session admin can't silently
  // re-route someone's email.
  let pendingEmail: string | null = null;
  if (isAdminActor && data.email !== undefined) {
    const current = await getSafeUserById(id);
    if (!current) throw new Error('User not found');
    if (current.email !== data.email) {
      const taken = await getUserByEmail(data.email);
      if (taken && taken.id !== id) {
        throw new Error('A user with that email already exists');
      }
      pendingEmail = data.email;
    }
  }

  let user;
  if (isAdminActor) {
    const fields: AdminUpdateUserInput = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.email !== undefined) fields.email = data.email;
    if (data.role !== undefined) fields.role = data.role;
    if (data.newPassword) fields.password = data.newPassword;
    if (pendingEmail) fields.emailVerified = null;
    user = await adminUpdateUserData(id, fields);
  } else {
    const fields: UpdateUserInput = {};
    if (data.name !== undefined) fields.name = data.name;
    if (data.newPassword) fields.password = data.newPassword;
    user = await updateUserData(id, fields);
  }

  if (pendingEmail) {
    try {
      const token = await generateVerificationToken(pendingEmail);
      await sendVerificationEmail(token.email, token.token);
    } catch (error) {
      console.error('Failed to send verification email after email change:', error);
    }
  }

  revalidatePath('/dashboard/settings/users');
  revalidatePath(`/dashboard/settings/users/${id}`);
  revalidatePath('/dashboard/profile');
  return user;
}

export async function deleteUser(id: string) {
  const actor = await requireSession();
  if (!isAdmin(actor)) throw new AuthzError('Forbidden');
  if (actor.id === id) throw new Error('Cannot delete your own account');

  await deleteUserData(id);
  revalidatePath('/dashboard/settings/users');
  return true;
}
