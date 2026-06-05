// app/(dashboard)/dashboard/positions/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { PositionsList } from '@/components/positions/positions-list';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function PositionsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to access this page
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    redirect('/dashboard');
  }

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Roles'
        title='Positions'
        description='Manage open positions for candidates.'
        action={
          <Button asChild>
            <Link href='/dashboard/positions/new'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add position
            </Link>
          </Button>
        }
      />

      <PositionsList />
    </div>
  );
}
