// app/(dashboard)/dashboard/settings/layout.tsx

import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { requirePageOrgRole } from '@/lib/authz';
interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  await requirePageOrgRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]);

  return <div className='space-y-6'>{children}</div>;
}
