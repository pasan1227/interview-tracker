// app/(dashboard)/settings/general/page.tsx

import { getSettings } from '@/data/settings';
import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { PageHeader } from '@/components/page-header';
import { GeneralSettingsForm } from '@/components/settings/general-settings-form';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

export default async function GeneralSettingsPage() {
  const user = await requirePageOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
  ]);

  const settings = await getSettings(toOrgContext(user));

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
