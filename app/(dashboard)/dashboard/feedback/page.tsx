// app/(dashboard)/dashboard/feedback/page.tsx

import { auth } from '@/auth';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getFeedbacksByInterviewer } from '@/data/feedback';
import { RECOMMENDATION_BADGE } from '@/lib/constants/status-styles';
import { formatDate } from '@/lib/utils';
import { ExternalLinkIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

export default async function FeedbackPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Reviews'
        title='My feedback'
        description="View all feedback you've submitted for candidates."
      />

      <Suspense fallback={<Loading />}>
        <FeedbackList userId={session.user.id!} />
      </Suspense>
    </div>
  );
}

async function FeedbackList({ userId }: { userId: string }) {
  const feedbacks = await getFeedbacksByInterviewer(userId);

  if (feedbacks.length === 0) {
    return (
      <div className='flex h-[400px] flex-col items-center justify-center space-y-2 p-8 text-center'>
        <h3 className='text-lg font-semibold'>No feedback submitted yet</h3>
        <p className='text-sm text-muted-foreground'>
          You haven&apos;t provided feedback for any interviews yet
        </p>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidate</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.map((feedback) => (
            <TableRow key={feedback.id}>
              <TableCell className='font-medium'>
                <Link
                  href={`/dashboard/candidates/${feedback.candidate.id}`}
                  className='hover:underline'
                >
                  {feedback.candidate.name}
                </Link>
              </TableCell>
              <TableCell>{feedback.interview.position.title}</TableCell>
              <TableCell>
                <div
                  className='flex items-center gap-0.5'
                  role='img'
                  aria-label={`${feedback.rating} out of 5`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      aria-hidden
                      className='h-4 w-4'
                      strokeWidth={1.75}
                      style={{
                        color:
                          i < feedback.rating
                            ? 'var(--forest)'
                            : 'var(--border)',
                        fill:
                          i < feedback.rating ? 'var(--forest)' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant='outline'
                  className={`${RECOMMENDATION_BADGE[feedback.recommendation]} border-0`}
                >
                  {feedback.recommendation.replace(/_/g, ' ')}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(feedback.createdAt)}</TableCell>
              <TableCell className='text-right'>
                <Button variant='outline' size='sm' asChild>
                  <Link href={`/dashboard/interviews/${feedback.interviewId}`}>
                    <ExternalLinkIcon className='mr-2 h-4 w-4' />
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
