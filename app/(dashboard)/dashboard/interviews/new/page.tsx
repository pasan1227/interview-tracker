// app/(dashboard)/dashboard/interviews/new/page.tsx

import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { PageHeader } from '@/components/dashboard/page-header';
import { InterviewForm } from '@/components/interviews/interview-form-lazy';
import { getInterviewFormOptions } from '@/data/interview-form';

interface NewInterviewPageProps {
  searchParams: Promise<{
    candidateId?: string;
  }>;
}

export default async function NewInterviewPage({
  searchParams,
}: NewInterviewPageProps) {
  // Matches createInterview's requireOrgManagerOrAdmin gate so we don't
  // serve a form that submits to an action that will reject.
  const session = await requirePageOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MANAGER,
  ]);
  const ctx = toOrgContext(session);
  const { candidateId } = await searchParams;

  const { candidates, positions, interviewers, stagesByPosition } =
    await getInterviewFormOptions(ctx, { canSeeRoster: true });

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='New'
        title='Schedule interview'
        description='Set up a new interview with a candidate.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <InterviewForm
          defaultCandidateId={candidateId}
          candidates={candidates}
          positions={positions}
          interviewers={interviewers}
          stagesByPosition={stagesByPosition}
        />
      </div>
    </div>
  );
}
