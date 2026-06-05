'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface ReportTabsProps<T extends string> {
  activeTab: T;
  labels: Record<T, string>;
}

// Tab strip that drives the page via ?tab= rather than client state.
// Clicking a tab is a soft navigation; the server then renders only
// that tab's <Section>. Preserves every other searchParam (filter
// dates, position, source) so changing tabs doesn't drop filters.
export function ReportTabs<T extends string>({
  activeTab,
  labels,
}: Readonly<ReportTabsProps<T>>) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const hrefFor = (tab: T) => {
    const next = new URLSearchParams(sp.toString());
    next.set('tab', tab);
    return `${pathname}?${next.toString()}`;
  };

  const entries = Object.entries(labels) as [T, string][];

  return (
    <div className='grid w-full grid-cols-3 gap-1 rounded-md border border-border bg-secondary p-1 lg:grid-cols-6'>
      {entries.map(([value, label]) => {
        const isActive = value === activeTab;
        return (
          <Link
            key={value}
            href={hrefFor(value)}
            scroll={false}
            className={cn(
              'rounded-md px-3 py-1.5 text-center text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
