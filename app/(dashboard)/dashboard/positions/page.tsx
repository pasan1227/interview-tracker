// app/(dashboard)/dashboard/positions/page.tsx

import Link from 'next/link';
import { requirePageRole } from '@/lib/authz';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { PositionsList } from '@/components/positions/positions-list';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function PositionsPage() {
  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);

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
