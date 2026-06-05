// app/(dashboard)/layout.tsx

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { getCurrentUser } from '@/lib/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const user = await getCurrentUser();

  return (
    <div className='flex min-h-screen flex-col bg-background text-foreground'>
      {/* @ts-expect-error Server Component */}
      <DashboardHeader user={user!} />
      <div className='flex flex-1'>
        <DashboardNav role={user?.role} />
        <main className='flex-1 px-6 py-8 lg:px-10 lg:py-10'>{children}</main>
      </div>
    </div>
  );
}
