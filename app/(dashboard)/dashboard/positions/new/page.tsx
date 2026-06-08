// app/(dashboard)/dashboard/positions/new/page.tsx

import { PageHeader } from '@/components/dashboard/page-header';
import { PositionForm } from '@/components/positions/position-form-lazy';
import { requirePageOrgRole } from '@/lib/authz';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { db } from '@/lib/db';

export default async function NewPositionPage() {
  await requirePageOrgRole([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MANAGER]);

  const workflows = await db.workflow.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='New'
        title='Add new position'
        description='Create a new position for candidates.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <PositionForm workflows={workflows} />
      </div>
    </div>
  );
}
