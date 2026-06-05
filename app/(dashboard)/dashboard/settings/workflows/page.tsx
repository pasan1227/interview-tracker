// app/(dashboard)/dashboard/settings/workflows/page.tsx

import { Button } from '@/components/ui/button';
import { requirePageRole } from '@/lib/authz';
import { WorkflowsList } from '@/components/workflows/workflows-list';
import { UserRole } from '@/lib/generated/prisma/browser';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
export default async function WorkflowsPage() {
  await requirePageRole(UserRole.ADMIN);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Interview Workflows</h1>
          <p className='text-muted-foreground'>
            Configure interview stages and processes for different positions
          </p>
        </div>
        <Button asChild>
          <Link href='/dashboard/settings/workflows/new'>
            <PlusIcon className='mr-2 h-4 w-4' />
            Create Workflow
          </Link>
        </Button>
      </div>

      <WorkflowsList />
    </div>
  );
}
