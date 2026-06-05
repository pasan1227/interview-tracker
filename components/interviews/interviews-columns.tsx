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
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ClipboardIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';

// Extended type for interviews with related data
export type InterviewWithRelations = Interview & {
  candidate: Candidate;
  position: Position;
  interviewers: Pick<User, 'id' | 'name' | 'email' | 'image'>[];
  stage: Stage | null;
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
      const statusConfig = {
        [InterviewStatus.SCHEDULED]: { color: 'bg-blue-50 text-blue-600' },
        [InterviewStatus.COMPLETED]: { color: 'bg-green-50 text-green-600' },
        [InterviewStatus.CANCELED]: { color: 'bg-red-50 text-red-600' },
        [InterviewStatus.NO_SHOW]: { color: 'bg-yellow-50 text-yellow-600' },
      };

      const { color } =
        statusConfig[status] || statusConfig[InterviewStatus.SCHEDULED];

      return (
        <Badge variant='outline' className={`${color} border-0`}>
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
            className={
              totalFeedbacks === totalInterviewers
                ? 'text-green-600'
                : 'text-amber-600'
            }
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
                className='text-red-600'
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
