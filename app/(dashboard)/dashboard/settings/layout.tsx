// app/(dashboard)/dashboard/settings/layout.tsx

import { auth } from '@/auth';
import { UserRole } from '@/lib/generated/prisma/browser';
import { redirect } from 'next/navigation';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Only admin can access settings
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return <div className='space-y-6'>{children}</div>;
}
