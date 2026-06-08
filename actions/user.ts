'use server';

import {
  getSafeUserById,
  getUserPasswordHash,
  updateUser as updateUserData,
  type UpdateUserInput,
} from '@/data/user';
import { AuthzError, requireSession } from '@/lib/authz';
import {
  UpdateUserSchema,
  type UpdateUserActionInput,
} from '@/lib/validations/auth';
import bcrypt from 'bcryptjs';
import { revalidateUser } from '@/lib/revalidate';

// PR 13: createUser + deleteUser are gone.
// New users join via the invitation flow (actions/org/invite-member.ts
// → actions/org/accept-invitation.ts → registration). Removing them
// from an org is now a Membership operation
// (actions/org/revoke-membership.ts), not a User deletion.
//
// updateUser stays but is limited to self-service: the signed-in user
// can change their own name and password. The "admin edits any user's
// email/role" path was always a sharp edge; now it's gone too.

export async function updateUser(id: string, input: UpdateUserActionInput) {
  const actor = await requireSession();
  if (actor.id !== id) throw new AuthzError('Forbidden');

  const data = UpdateUserSchema.parse(input);

  // Changing your password requires proving the current one. Defeats
  // account takeover from a stolen session.
  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new AuthzError('Current password is required to set a new one');
    }
    const hash = await getUserPasswordHash(id);
    if (!hash) throw new AuthzError('Cannot change password for this account');
    const ok = await bcrypt.compare(data.currentPassword, hash);
    if (!ok) throw new AuthzError('Current password is incorrect');
  }

  // Confirm the user still exists. Lookup also ensures a session
  // pointing at a deleted user gets a clean "not found".
  const current = await getSafeUserById(id);
  if (!current) throw new Error('User not found');

  const fields: UpdateUserInput = {};
  if (data.name !== undefined) fields.name = data.name;
  if (data.newPassword) fields.password = data.newPassword;
  const user = await updateUserData(id, fields);

  revalidateUser(id);
  return user;
}
