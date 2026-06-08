import { Prisma } from '@/lib/generated/prisma/browser';
import { tenantDb, type OrgContext } from '@/lib/tenant-db';

// PR 10: Settings is now genuinely per-org. The schema enforces one
// row per organizationId (@@unique on Settings.organizationId from
// PR 3), and every read/write goes through tenantDb so it stays
// physically scoped to the active org.
//
// findOrCreateForOrg covers the case where a freshly-created org
// doesn't have a settings row yet — that path is wired into
// signup/onboarding flows in PR 11+; this fallback keeps the page
// working in the meantime.

const DEFAULT_VALUES = {
  companyName: 'Interview Tracker',
  companyLogo: null,
  emailNotifications: true,
  feedbackReminders: true,
  defaultInterviewLength: 60,
} as const;

async function findOrCreateForOrg(ctx: OrgContext) {
  const db = tenantDb(ctx);
  const existing = await db.settings.findFirst();
  if (existing) return existing;

  return db.settings.create({
    data: {
      ...DEFAULT_VALUES,
      organizationId: ctx.organizationId,
    },
  });
}

export async function getSettings(ctx: OrgContext) {
  try {
    return await findOrCreateForOrg(ctx);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {
      id: 'default',
      ...DEFAULT_VALUES,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: ctx.organizationId,
    };
  }
}

export async function updateSettings(
  ctx: OrgContext,
  data: Prisma.SettingsUpdateInput
) {
  try {
    const db = tenantDb(ctx);
    const settings = await findOrCreateForOrg(ctx);
    return await db.settings.update({
      where: { id: settings.id },
      data,
    });
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}
