// app/(dashboard)/dashboard/candidates/[id]/page.tsx

import { requirePageRole } from '@/lib/authz';
import { CandidateFeedback } from '@/components/candidates/candidate-feedback';
import { CandidateInfo } from '@/components/candidates/candidate-info';
import { CandidateInterviews } from '@/components/candidates/candidate-interviews';
import { CandidateNotes } from '@/components/candidates/candidate-notes';
import { CandidateStatusUpdate } from '@/components/candidates/candidate-status-update';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCandidateById } from '@/data/candidate';
import { CANDIDATE_STATUS_BADGE } from '@/lib/constants/status-styles';
import { UserRole } from '@/lib/generated/prisma/browser';
import { CalendarIcon, PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CandidateDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetailsPage({
  params,
}: CandidateDetailsPageProps) {
  // PII gate: candidate detail (name, email, notes, feedback) is
  // manager/admin only. INTERVIEWER role accesses candidates via the
  // interview detail page where their participation is verified.
  await requirePageRole([UserRole.ADMIN, UserRole.MANAGER]);
  const { id } = await params;

  const candidate = await getCandidateById(id);

  if (!candidate) {
    notFound();
  }

  const statusClass =
    CANDIDATE_STATUS_BADGE[candidate.status] ?? CANDIDATE_STATUS_BADGE.NEW;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold'>{candidate.name}</h1>
            <Badge variant='outline' className={`${statusClass} border-0`}>
              {candidate.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className='text-muted-foreground'>
            {candidate.position?.title || 'No position'} - {candidate.email}
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <CandidateStatusUpdate candidate={candidate} />

          <Button variant='outline' asChild>
            <Link
              href={`/dashboard/interviews/new?candidateId=${candidate.id}`}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              Schedule Interview
            </Link>
          </Button>

          <Button variant='outline' asChild>
            <Link href={`/dashboard/candidates/${candidate.id}/edit`}>
              <PencilIcon className='mr-2 h-4 w-4' />
              Edit
            </Link>
          </Button>

          <Button variant='outline' className='text-red-600' asChild>
            <Link href={`/dashboard/candidates/${candidate.id}/delete`}>
              <TrashIcon className='mr-2 h-4 w-4' />
              Delete
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue='info' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='info'>Information</TabsTrigger>
          <TabsTrigger value='interviews'>
            Interviews ({candidate.interviews.length})
          </TabsTrigger>
          <TabsTrigger value='feedback'>
            Feedback ({candidate.feedbacks.length})
          </TabsTrigger>
          <TabsTrigger value='notes'>
            Notes ({candidate.notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='info' className='p-4 bg-white rounded-md border'>
          <CandidateInfo candidate={candidate} />
        </TabsContent>

        <TabsContent
          value='interviews'
          className='p-4 bg-white rounded-md border'
        >
          <CandidateInterviews interviews={candidate.interviews} />
        </TabsContent>

        <TabsContent
          value='feedback'
          className='p-4 bg-white rounded-md border'
        >
          <CandidateFeedback feedbacks={candidate.feedbacks} />
        </TabsContent>

        <TabsContent value='notes' className='p-4 bg-white rounded-md border'>
          <CandidateNotes notes={candidate.notes} candidateId={candidate.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
