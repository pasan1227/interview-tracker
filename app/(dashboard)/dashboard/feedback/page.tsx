// app/(dashboard)/dashboard/feedback/page.tsx

import { auth } from '@/auth';
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
import { Recommendation } from '@/lib/generated/prisma';
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
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>My Feedback</h1>
        <p className='text-muted-foreground'>
          View all feedback you&apos;ve submitted for candidates
        </p>
      </div>

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

  const recommendationColors = {
    [Recommendation.STRONG_HIRE]: 'bg-green-50 text-green-600',
    [Recommendation.HIRE]: 'bg-green-50 text-green-600',
    [Recommendation.NO_DECISION]: 'bg-gray-50 text-gray-600',
    [Recommendation.NO_HIRE]: 'bg-red-50 text-red-600',
    [Recommendation.STRONG_NO_HIRE]: 'bg-red-50 text-red-600',
  };

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
                <div className='flex items-center'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < feedback.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant='outline'
                  className={`${recommendationColors[feedback.recommendation]} border-0`}
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
