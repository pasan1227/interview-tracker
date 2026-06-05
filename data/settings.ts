import { db } from '@/lib/db';
import { Prisma } from '@/lib/generated/prisma/browser';

export async function getSettings() {
  try {
    // Get the first settings record or create one if it doesn't exist
    let settings = await db.settings.findFirst();

    if (!settings) {
      settings = await db.settings.create({
        data: {
          companyName: 'Interview Tracker',
          emailNotifications: true,
          feedbackReminders: true,
          defaultInterviewLength: 60,
        },
      });
    }

    return settings;
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
    };
  }
}

export async function updateSettings(
  data: Prisma.SettingsUpdateInput & Prisma.SettingsCreateInput
) {
  try {
    // Get the first settings record
    const settings = await db.settings.findFirst();

    if (settings) {
      // Update existing settings
      return await db.settings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      // Create new settings if they don't exist
      return await db.settings.create({
        data,
      });
    }
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}
