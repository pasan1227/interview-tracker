import { redirect, notFound } from 'next/navigation';
import { requirePageOrgSession, toOrgContext } from '@/lib/authz';
import { getInterviewForForm } from '@/data/interview';
import { getInterviewFormOptions } from '@/data/interview-form';
import { PageHeader } from '@/components/dashboard/page-header';
import { InterviewForm } from '@/components/interviews/interview-form-lazy';
import { OrganizationRole, UserRole } from '@/lib/generated/prisma/browser';

interface EditInterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInterviewPage({
  params,
}: EditInterviewPageProps) {
  const session = await requirePageOrgSession();
  const ctx = toOrgContext(session);
  const { id } = await params;

  const legacyRole: UserRole =
    session.role === OrganizationRole.OWNER ||
    session.role === OrganizationRole.ADMIN
      ? UserRole.ADMIN
      : session.role === OrganizationRole.MANAGER
        ? UserRole.MANAGER
        : session.role === OrganizationRole.INTERVIEWER
          ? UserRole.INTERVIEWER
          : UserRole.USER;

  // Interview lookup + form bootstrap run in parallel. Gate runs after
  // we have the interview record.
  const [interview, { candidates, positions, interviewers, stagesByPosition }] =
    await Promise.all([
      getInterviewForForm(ctx, id),
      getInterviewFormOptions(ctx, { viewerRole: legacyRole }),
    ]);

  if (!interview) {
    notFound();
  }

  // Mutation gate: matches authorizeInterviewMutation in
  // actions/interview.ts — managers/admins, the creator, or a listed
  // interviewer can edit.
  const isInterviewer = interview.interviewers.some(
    (interviewer) => interviewer.id === session.id
  );
  const isCreator = interview.createdById === session.id;
  const isManagerOrAdmin =
    session.role === OrganizationRole.OWNER ||
    session.role === OrganizationRole.ADMIN ||
    session.role === OrganizationRole.MANAGER;
  if (!isManagerOrAdmin && !isCreator && !isInterviewer) {
    redirect('/dashboard');
  }

  // updateInterview strips non-notes/status fields server-side for a
  // plain interviewer (see actions/interview.ts privilege ceiling). Tell
  // the form so it can disable those inputs instead of silently dropping
  // edits on submit.
  const canEditScheduling = isManagerOrAdmin || isCreator;

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Edit'
        title='Edit interview'
        description='Update the interview details.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <InterviewForm
          interview={interview}
          candidates={candidates}
          positions={positions}
          interviewers={interviewers}
          stagesByPosition={stagesByPosition}
          isEdit
          canEditScheduling={canEditScheduling}
        />
      </div>
    </div>
  );
}
