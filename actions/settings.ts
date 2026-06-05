'use server';

import { updateSettings as updateSettingsData } from '@/data/settings';
import { requireAdmin } from '@/lib/authz';
import {
  UpdateSettingsSchema,
  type UpdateSettingsInput,
} from '@/lib/validations/dashboard';
import { revalidateSettings } from '@/lib/revalidate';

export async function updateSettings(input: UpdateSettingsInput) {
  await requireAdmin();
  const data = UpdateSettingsSchema.parse(input);

  const settings = await updateSettingsData({
    companyName: data.companyName,
    companyLogo: emptyToNull(data.companyLogo),
    emailNotifications: data.emailNotifications,
    feedbackReminders: data.feedbackReminders,
    defaultInterviewLength: data.defaultInterviewLength,
  });

  revalidateSettings();
  return settings;
}

function emptyToNull<T extends string | null | undefined>(v: T) {
  return v === '' || v == null ? null : v;
}
