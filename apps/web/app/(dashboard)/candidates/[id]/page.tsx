import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { CandidateFeedback } from '@/components/candidates/candidate-feedback';
import { CandidateInfo } from '@/components/candidates/candidate-info';
import { CandidateInterviews } from '@/components/candidates/candidate-interviews';
import { CandidateNotes } from '@/components/candidates/candidate-notes';
import { CandidateStatusUpdate } from '@/components/candidates/candidate-status-update';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getCandidateFeedbackTab,
  getCandidateHeader,
  getCandidateInterviewsTab,
  getCandidateNotesTab,
} from '@/data/candidate';
import { CANDIDATE_STATUS_BADGE } from '@/lib/constants/status-styles';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { CalendarIcon, PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

interface CandidateDetailsPageProps {
  params: Promise<{ id: string }>;
}

// Header awaits the lightweight scalar+counts fetch synchronously; each
// tab body is its own async server component wrapped in <Suspense>, so
// the three relation queries fan out in parallel rather than blocking
// the page header behind one giant include. Tabs are rendered in DOM by
// the Radix Tabs primitive, so all three Suspense boundaries do fire on
// initial paint — but they stream concurrently, not serially behind the
// header.

export default async function CandidateDetailsPage({
  params,
}: CandidateDetailsPageProps) {
  // PII gate: candidate detail (name, email, notes, feedback) is
  // manager+ only (org-scoped).
  const user = await requirePageOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
    OrganizationRole.MANAGER,
  ]);
  const ctx = toOrgContext(user);
  const { id } = await params;

  const candidate = await getCandidateHeader(ctx, id);
  if (!candidate) notFound();

  const statusClass =
    CANDIDATE_STATUS_BADGE[candidate.status] ?? CANDIDATE_STATUS_BADGE.NEW;

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Candidate'
        title={candidate.name}
        description={`${candidate.position?.title || 'No position'} · ${candidate.email}`}
        action={
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='outline' style={statusClass} className='border-0'>
              {candidate.status.replace(/_/g, ' ')}
            </Badge>
            <CandidateStatusUpdate candidate={candidate} />
            <Button variant='outline' asChild>
              <Link
                href={`/interviews/new?candidateId=${candidate.id}`}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                Schedule Interview
              </Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href={`/candidates/${candidate.id}/edit`}>
                <PencilIcon className='mr-2 h-4 w-4' />
                Edit
              </Link>
            </Button>
            <Button variant='outline' className='text-destructive' asChild>
              <Link href={`/candidates/${candidate.id}/delete`}>
                <TrashIcon className='mr-2 h-4 w-4' />
                Delete
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue='info' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='info'>Information</TabsTrigger>
          <TabsTrigger value='interviews'>
            Interviews ({candidate._count.interviews})
          </TabsTrigger>
          <TabsTrigger value='feedback'>
            Feedback ({candidate._count.feedbacks})
          </TabsTrigger>
          <TabsTrigger value='notes'>
            Notes ({candidate._count.notes})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='info' className='rounded-md border bg-card p-4'>
          <CandidateInfo candidate={candidate} />
        </TabsContent>

        <TabsContent
          value='interviews'
          className='rounded-md border bg-card p-4'
        >
          <Suspense fallback={<TabSkeleton />}>
            <InterviewsSection ctx={ctx} candidateId={id} />
          </Suspense>
        </TabsContent>

        <TabsContent value='feedback' className='rounded-md border bg-card p-4'>
          <Suspense fallback={<TabSkeleton />}>
            <FeedbackSection ctx={ctx} candidateId={id} />
          </Suspense>
        </TabsContent>

        <TabsContent value='notes' className='rounded-md border bg-card p-4'>
          <Suspense fallback={<TabSkeleton />}>
            <NotesSection ctx={ctx} candidateId={id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function InterviewsSection({
  ctx,
  candidateId,
}: {
  ctx: ReturnType<typeof toOrgContext>;
  candidateId: string;
}) {
  const interviews = await getCandidateInterviewsTab(ctx, candidateId);
  return <CandidateInterviews interviews={interviews} />;
}

async function FeedbackSection({
  ctx,
  candidateId,
}: {
  ctx: ReturnType<typeof toOrgContext>;
  candidateId: string;
}) {
  const feedbacks = await getCandidateFeedbackTab(ctx, candidateId);
  return <CandidateFeedback feedbacks={feedbacks} />;
}

async function NotesSection({
  ctx,
  candidateId,
}: {
  ctx: ReturnType<typeof toOrgContext>;
  candidateId: string;
}) {
  const notes = await getCandidateNotesTab(ctx, candidateId);
  return <CandidateNotes notes={notes} candidateId={candidateId} />;
}

function TabSkeleton() {
  return (
    <div className='space-y-3' aria-hidden>
      <div className='h-20 rounded-md bg-secondary' />
      <div className='h-20 rounded-md bg-secondary' />
      <div className='h-20 rounded-md bg-secondary' />
    </div>
  );
}
