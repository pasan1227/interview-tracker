// app/(dashboard)/dashboard/positions/[positionId]/delete/page.tsx

import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { db } from '@/lib/db';
import { DeleteResourcePage } from '@/components/dashboard/delete-resource-page';
import { PositionDeleteForm } from '@/components/positions/position-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface DeletePositionPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeletePositionPageRoute({
  params,
}: DeletePositionPageProps) {
  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);
  const { id: positionId } = await params;

  const [position, candidateCount, interviewCount] = await Promise.all([
    db.position.findUnique({
      where: { id: positionId },
      include: { workflow: true },
    }),
    db.candidate.count({ where: { positionId } }),
    db.interview.count({ where: { positionId } }),
  ]);

  if (!position) {
    notFound();
  }

  return (
    <DeleteResourcePage
      title='Delete position'
      description='Are you sure you want to delete this position?'
      resourceLabel='position'
      resourceName={position.title}
      detailsHeading='Position information'
      details={[
        { label: 'Title', value: position.title },
        { label: 'Department', value: position.department },
        { label: 'Workflow', value: position.workflow?.name ?? 'None' },
        { label: 'Status', value: position.isActive ? 'Active' : 'Inactive' },
        { label: 'Candidates', value: candidateCount },
        { label: 'Interviews', value: interviewCount },
      ]}
      impact={[
        { label: 'candidates', count: candidateCount },
        { label: 'interviews', count: interviewCount },
      ]}
      cancelHref='/dashboard/positions'
    >
      <PositionDeleteForm positionId={position.id} />
    </DeleteResourcePage>
  );
}
