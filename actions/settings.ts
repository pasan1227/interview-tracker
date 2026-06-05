// lib/actions/settings.ts

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { updateSettings as updateSettingsData } from '@/data/settings';
import { UserRole } from '@/lib/generated/prisma/browser';

export async function updateSettings(data: any) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized');
  }

  const settings = await updateSettingsData(data);

  revalidatePath('/dashboard/settings/general');
  return settings;
}
