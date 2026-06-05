// app/(dashboard)/dashboard/settings/general/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getSettings } from '@/data/settings';
import { GeneralSettingsForm } from '@/components/settings/general-settings-form';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function GeneralSettingsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Only admin can access general settings
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const settings = await getSettings();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>General Settings</h1>
        <p className='text-muted-foreground'>
          Configure system-wide settings for the interview tracking platform
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <GeneralSettingsForm settings={settings} />
      </div>
    </div>
  );
}
