// app/(dashboard)/dashboard/settings/general/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getSettings } from '@/data/settings';
import { PageHeader } from '@/components/dashboard/page-header';
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
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Settings'
        title='General'
        description='Configure system-wide settings for the interview tracking platform.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <GeneralSettingsForm settings={settings} />
      </div>
    </div>
  );
}
