// app/(dashboard)/dashboard/settings/layout.tsx

import { UserRole } from '@/lib/generated/prisma/browser';
import { requirePageRole } from '@/lib/authz';
interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  await requirePageRole(UserRole.ADMIN);

  return <div className='space-y-6'>{children}</div>;
}
