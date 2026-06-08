import { db } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/browser';

// Bridge implementation. Until PR 10 makes Settings genuinely per-org,
// the data layer continues to act on the single existing Settings
// row. The backfill (PR 2) guarantees one row exists, tied to the
// default org; new orgs created in PR 11+ provision their own row at
// signup time.
async function findOrCreateDefaultSettings() {
  const existing = await db.settings.findFirst();
  if (existing) return existing;

  const defaultOrg = await db.organization.findUniqueOrThrow({
    where: { slug: 'default' },
    select: { id: true },
  });
  return db.settings.create({
    data: {
      companyName: 'Interview Tracker',
      emailNotifications: true,
      feedbackReminders: true,
      defaultInterviewLength: 60,
      organizationId: defaultOrg.id,
    },
  });
}

export async function getSettings() {
  try {
    return await findOrCreateDefaultSettings();
  } catch (error) {
    console.error('Failed to fetch settings:', error);

    // Return default settings if there's an error
    return {
      id: 'default',
      companyName: 'Interview Tracker',
      companyLogo: null,
      emailNotifications: true,
      feedbackReminders: true,
      defaultInterviewLength: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: '',
    };
  }
}

export async function updateSettings(data: Prisma.SettingsUpdateInput) {
  try {
    // findOrCreateDefaultSettings guarantees a row exists, so update
    // is enough — no need to accept SettingsCreateInput here.
    const settings = await findOrCreateDefaultSettings();
    return await db.settings.update({
      where: { id: settings.id },
      data,
    });
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}
