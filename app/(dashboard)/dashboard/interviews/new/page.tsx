// app/(dashboard)/dashboard/interviews/new/page.tsx

import { requirePageRole } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';
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
  // Matches createInterview's requireManagerOrAdmin gate so we don't
  // serve a form that submits to an action that will reject.
  const session = await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);
  const { candidateId } = await searchParams;

  const { candidates, positions, interviewers, stagesByPosition } =
    await getInterviewFormOptions({ viewerRole: session.role });

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
