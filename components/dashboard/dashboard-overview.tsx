// components/dashboard/dashboard-overview.tsx

'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Candidate, Interview } from '@/lib/generated/prisma/browser';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';

interface OverviewItem {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  href: string;
}

interface DashboardOverviewProps {
  title: string;
  data: Array<Interview | Candidate>;
  viewAllHref: string;
}

export function DashboardOverview({
  title,
  data,
  viewAllHref,
}: DashboardOverviewProps) {
  // Transform data to standard format
  const items: OverviewItem[] = data.map((item) => {
    if ('startTime' in item) {
      // It's an interview
      const interview = item as Interview & {
        candidate: { name: string };
        position: { title: string };
      };

      return {
        id: interview.id,
        title: interview.title,
        subtitle: `${interview.candidate.name} - ${interview.position.title}`,
        date: new Date(interview.startTime),
        href: `/dashboard/interviews/${interview.id}`,
      };
    } else {
      // It's a candidate
      const candidate = item as Candidate & {
        position: { title: string } | null;
      };

      return {
        id: candidate.id,
        title: candidate.name,
        subtitle: candidate.position?.title || 'No position',
        date: new Date(candidate.createdAt),
        href: `/dashboard/candidates/${candidate.id}`,
      };
    }
  });

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='pb-2'>
        {items.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-6 text-center'>
            <p className='text-sm text-muted-foreground'>No items to display</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {items.map((item) => (
              <div
                key={item.id}
                className='flex items-center justify-between border-b pb-3 last:border-0'
              >
                <div>
                  <Link
                    href={item.href}
                    className='font-medium hover:underline'
                  >
                    {item.title}
                  </Link>
                  <p className='text-sm text-muted-foreground'>
                    {item.subtitle}
                  </p>
                </div>
                <div className='text-xs text-muted-foreground'>
                  {formatDistanceToNow(item.date, { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant='ghost' size='sm' className='w-full' asChild>
          <Link href={viewAllHref}>
            View All
            <ExternalLinkIcon className='ml-2 h-4 w-4' />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
