'use server';

import { updateSettings as updateSettingsData } from '@/data/settings';
import { requireOrgAdmin, toOrgContext } from '@/lib/authz';
import {
  UpdateSettingsSchema,
  type UpdateSettingsInput,
} from '@/lib/validations/dashboard';
import { revalidateSettings } from '@/lib/revalidate';

export async function updateSettings(input: UpdateSettingsInput) {
  const user = await requireOrgAdmin();
  const ctx = toOrgContext(user);
  const data = UpdateSettingsSchema.parse(input);

  const settings = await updateSettingsData(ctx, {
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
