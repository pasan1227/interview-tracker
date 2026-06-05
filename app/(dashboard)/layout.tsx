import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single session read for the whole render — getSession is React-cached so
  // any child that also calls getSession / getCurrentUser dedupes onto this.
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const user = session.user;

  return (
    <div className='flex min-h-screen flex-col bg-background text-foreground'>
      <DashboardHeader user={user} />
      <div className='flex flex-1'>
        <DashboardNav role={user.role} />
        <main className='flex-1 px-6 py-8 lg:px-10 lg:py-10'>{children}</main>
      </div>
    </div>
  );
}
