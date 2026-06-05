// components/candidates/candidates-columns.tsx

'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
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
import { CANDIDATE_STATUS_BADGE } from '@/lib/constants/status-styles';
import { MoreHorizontalIcon, ExternalLinkIcon } from 'lucide-react';
import { Candidate, CandidateStatus, Position } from '@/lib/generated/prisma/browser';

// Extended type for candidates with related data
export type CandidateWithRelations = Candidate & {
  position: Position | null;
};

export const CandidateColumns: ColumnDef<CandidateWithRelations>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const candidate = row.original;
      return (
        <Link
          href={`/dashboard/candidates/${candidate.id}`}
          className='font-medium text-primary hover:underline'
        >
          {candidate.name}
        </Link>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'position.title',
    header: 'Position',
    cell: ({ row }) => row.original.position?.title || 'No position',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status as CandidateStatus;
      const color =
        CANDIDATE_STATUS_BADGE[status] ?? CANDIDATE_STATUS_BADGE.NEW;
      return (
        <Badge variant='outline' style={color} className='border-0'>
          {status.replace(/_/g, ' ')}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date Added',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const candidate = row.original;

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
              <Link href={`/dashboard/candidates/${candidate.id}`}>
                <ExternalLinkIcon className='mr-2 h-4 w-4' /> View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/candidates/${candidate.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/interviews/new?candidateId=${candidate.id}`}
              >
                Schedule Interview
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/candidates/${candidate.id}/delete`}
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
