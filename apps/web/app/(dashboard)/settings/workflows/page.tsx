// app/(dashboard)/settings/workflows/page.tsx

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { requirePageOrgRole } from '@/lib/authz';
import { WorkflowsList } from '@/components/workflows/workflows-list';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
export default async function WorkflowsPage() {
  await requirePageOrgRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]);

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Settings'
        title='Interview workflows'
        description='Configure interview stages and processes for different positions.'
        action={
          <Button asChild>
            <Link href='/settings/workflows/new'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Create workflow
            </Link>
          </Button>
        }
      />

      <WorkflowsList />
    </div>
  );
}
