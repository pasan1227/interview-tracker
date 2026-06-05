// app/(dashboard)/dashboard/positions/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Positions</h1>
          <p className='text-muted-foreground'>
            Manage open positions for candidates
          </p>
        </div>
        <Button asChild>
          <Link href='/dashboard/positions/new'>
            <PlusIcon className='mr-2 h-4 w-4' />
            Add Position
          </Link>
        </Button>
      </div>

      <PositionsList />
    </div>
  );
}
