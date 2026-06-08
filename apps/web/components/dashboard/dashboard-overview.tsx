import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Candidate, Interview } from '@/lib/generated/prisma/browser';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
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
}: Readonly<DashboardOverviewProps>) {
  const items: OverviewItem[] = data.map((item) => {
    if ('startTime' in item) {
      const interview = item as Interview & {
        candidate: { name: string };
        position: { title: string };
      };
      return {
        id: interview.id,
        title: interview.title,
        subtitle: `${interview.candidate.name} · ${interview.position.title}`,
        date: new Date(interview.startTime),
        href: `/interviews/${interview.id}`,
      };
    }
    const candidate = item as Candidate & {
      position: { title: string } | null;
    };
    return {
      id: candidate.id,
      title: candidate.name,
      subtitle: candidate.position?.title || 'No position',
      date: new Date(candidate.createdAt),
      href: `/candidates/${candidate.id}`,
    };
  });

  return (
    <Card className='rounded-xl border-border bg-card shadow-none'>
      <CardHeader className='flex flex-row items-center justify-between gap-3 border-b border-border'>
        <CardTitle className='text-[15px] font-medium tracking-[-0.01em]'>
          {title}
        </CardTitle>
        <span
          className='text-[11.5px] font-medium uppercase tracking-[0.12em]'
          style={{ color: 'var(--muted-foreground)' }}
        >
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </CardHeader>
      <CardContent className='p-0'>
        {items.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <p
              className='text-[13px]'
              style={{ color: 'var(--muted-foreground)' }}
            >
              Nothing here yet.
            </p>
          </div>
        ) : (
          <ul className='divide-y divide-border'>
            {items.map((item) => (
              <li
                key={item.id}
                className='flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-secondary/60'
              >
                <div className='min-w-0 flex-1'>
                  <Link
                    href={item.href}
                    className='block truncate text-[14px] font-medium leading-tight hover:underline'
                  >
                    {item.title}
                  </Link>
                  <p
                    className='mt-0.5 truncate text-[12.5px]'
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {item.subtitle}
                  </p>
                </div>
                <div
                  className='shrink-0 text-[12px]'
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {formatDistanceToNow(item.date, { addSuffix: true })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className='border-t border-border px-6 py-3'>
        <Link
          href={viewAllHref}
          className='ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-80'
          style={{ color: 'var(--forest)' }}
        >
          View all
          <ArrowUpRight className='size-3.5' strokeWidth={2} />
        </Link>
      </CardFooter>
    </Card>
  );
}
