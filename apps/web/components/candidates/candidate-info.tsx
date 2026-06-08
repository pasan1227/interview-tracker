// components/candidates/candidate-info.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Candidate, Position } from '@/lib/generated/prisma/browser';
import { formatDate } from '@/lib/utils';
import { ExternalLinkIcon, MailIcon, PhoneIcon, TagIcon } from 'lucide-react';

interface CandidateInfoProps {
  candidate: Candidate & {
    position: Position | null;
    tags: { id: string; name: string }[];
  };
}

export function CandidateInfo({ candidate }: CandidateInfoProps) {
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2'>
        <div>
          <h3 className='font-medium'>Contact Information</h3>
          <div className='mt-2 space-y-2'>
            {candidate.email && (
              <div className='flex items-center gap-2 text-sm'>
                <MailIcon
                  className='h-4 w-4 text-muted-foreground'
                  aria-label='Email'
                />
                <span>{candidate.email}</span>
              </div>
            )}
            {candidate.phone && (
              <div className='flex items-center gap-2 text-sm'>
                <PhoneIcon
                  className='h-4 w-4 text-muted-foreground'
                  aria-label='Phone'
                />
                <span>{candidate.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className='font-medium'>Position Information</h3>
          <div className='mt-2 space-y-2 text-sm'>
            <div>
              <span className='text-muted-foreground'>Position: </span>
              <span>{candidate.position?.title || 'No position'}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>Source: </span>
              <span>{candidate.source || 'Not specified'}</span>
            </div>
            <div>
              <span className='text-muted-foreground'>Created: </span>
              <span>{formatDate(candidate.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {candidate.resumeUrl && (
        <div>
          <h3 className='font-medium'>Resume</h3>
          <div className='mt-2'>
            <Button variant='outline' size='sm' asChild>
              <a
                href={candidate.resumeUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2'
                aria-label='View resume'
              >
                View resume
                <ExternalLinkIcon className='h-4 w-4' />
              </a>
            </Button>
          </div>
        </div>
      )}

      {candidate.tags.length > 0 && (
        <div>
          <h3 className='font-medium'>Tags</h3>
          <div className='mt-2 flex flex-wrap gap-2'>
            {candidate.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant='secondary'
                className='flex items-center gap-1'
              >
                <TagIcon className='h-3 w-3' aria-label='Tag' />
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
