import { notFound } from 'next/navigation';
import { requirePageOrgRole } from '@/lib/authz';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/dashboard/page-header';
import { PositionForm } from '@/components/positions/position-form-lazy';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

interface EditPositionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPositionPage({
  params,
}: EditPositionPageProps) {
  await requirePageOrgRole([OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MANAGER]);
  const { id: positionId } = await params;

  const position = await db.position.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    notFound();
  }

  const workflows = await db.workflow.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Edit'
        title='Edit position'
        description='Update position details.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <PositionForm position={position} workflows={workflows} isEdit />
      </div>
    </div>
  );
}
