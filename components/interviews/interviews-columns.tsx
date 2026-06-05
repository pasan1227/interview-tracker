// components/interviews/interviews-columns.tsx

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Candidate,
  Feedback,
  Interview,
  InterviewStatus,
  Position,
  Stage,
  User,
} from '@/lib/generated/prisma/browser';
import { INTERVIEW_STATUS_BADGE } from '@/lib/constants/status-styles';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ClipboardIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';

// Narrowed to the per-column projections data/interview.ts:getInterviews
// returns. Listing what's actually rendered keeps the prop type in
// sync with the query and stops future over-fetching from re-leaking
// fields the table never reads.
export type InterviewWithRelations = Interview & {
  candidate: Pick<Candidate, 'id' | 'name'>;
  position: Pick<Position, 'id' | 'title'>;
  interviewers: Pick<User, 'id' | 'name' | 'image'>[];
  stage: Pick<Stage, 'id' | 'name'> | null;
  feedbacks: Pick<Feedback, 'id' | 'interviewerId'>[];
};

export const InterviewColumns: ColumnDef<InterviewWithRelations>[] = [
  {
    accessorKey: 'title',
    header: 'Interview',
    cell: ({ row }) => {
      const interview = row.original;
      return (
        <div className='flex flex-col'>
          <Link
            href={`/dashboard/interviews/${interview.id}`}
            className='font-medium text-primary hover:underline'
          >
            {interview.title}
          </Link>
          <span className='text-xs text-muted-foreground'>
            {interview.type.replace(/_/g, ' ')}
            {interview.stage && ` - ${interview.stage.name}`}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'candidate.name',
    header: 'Candidate',
    cell: ({ row }) => {
      const interview = row.original;
      return (
        <Link
          href={`/dashboard/candidates/${interview.candidate.id}`}
          className='font-medium hover:underline'
        >
          {interview.candidate.name}
        </Link>
      );
    },
  },
  {
    accessorKey: 'startTime',
    header: 'Date & Time',
    cell: ({ row }) => {
      const interview = row.original;
      const startTime = new Date(interview.startTime);
      const endTime = new Date(interview.endTime);

      return (
        <div className='flex flex-col'>
          <span>{format(startTime, 'MMM d, yyyy')}</span>
          <span className='text-xs text-muted-foreground'>
            {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'interviewers',
    header: 'Interviewers',
    cell: ({ row }) => {
      const interview = row.original;
      const interviewers = interview.interviewers;

      return (
        <div className='flex -space-x-2 overflow-hidden'>
          {interviewers.slice(0, 3).map((interviewer) => (
            <Avatar
              key={interviewer.id}
              className='h-8 w-8 border-2 border-background'
            >
              <AvatarImage
                src={interviewer.image || ''}
                alt={interviewer.name || ''}
              />
              <AvatarFallback>
                {interviewer.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          ))}
          {interviewers.length > 3 && (
            <div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium'>
              +{interviewers.length - 3}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status as InterviewStatus;
      const color =
        INTERVIEW_STATUS_BADGE[status] ??
        INTERVIEW_STATUS_BADGE[InterviewStatus.SCHEDULED];
      return (
        <Badge variant='outline' style={color} className='border-0'>
          {status.replace(/_/g, ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'feedbacks',
    header: 'Feedback',
    cell: ({ row }) => {
      const interview = row.original;
      const totalInterviewers = interview.interviewers.length;
      const totalFeedbacks = interview.feedbacks.length;

      if (interview.status !== InterviewStatus.COMPLETED) {
        return <span className='text-muted-foreground'>-</span>;
      }

      return (
        <div className='flex items-center'>
          <span
            style={{
              color:
                totalFeedbacks === totalInterviewers
                  ? 'var(--badge-success-fg)'
                  : 'var(--badge-warning-fg)',
            }}
          >
            {totalFeedbacks}/{totalInterviewers}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const interview = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreHorizontalIcon className='h-4 w-4' />
              <span className='sr-only'>Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/interviews/${interview.id}`}>
                <ExternalLinkIcon className='mr-2 h-4 w-4' /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/interviews/${interview.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/candidates/${interview.candidateId}`}>
                <UserIcon className='mr-2 h-4 w-4' /> View Candidate
              </Link>
            </DropdownMenuItem>
            {interview.status === InterviewStatus.COMPLETED && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/interviews/${interview.id}/feedback/new`}
                >
                  <ClipboardIcon className='mr-2 h-4 w-4' /> Submit Feedback
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/interviews/${interview.id}/delete`}
                className='text-destructive'
              >
                Delete
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
