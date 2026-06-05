// app/(dashboard)/dashboard/interviews/new/page.tsx

import { requirePageRole } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';
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
  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);
  const { candidateId } = await searchParams;

  const { candidates, positions, interviewers } = await getInterviewFormOptions();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Schedule Interview</h1>
        <p className='text-muted-foreground'>
          Set up a new interview with a candidate
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <InterviewForm
          defaultCandidateId={candidateId}
          candidates={candidates}
          positions={positions}
          interviewers={interviewers!}
        />
      </div>
    </div>
  );
}
