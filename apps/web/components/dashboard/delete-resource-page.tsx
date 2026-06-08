import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';

interface ImpactItem {
  label: string;
  count: number;
}

interface DetailItem {
  label: string;
  value: string | number | null | undefined;
}

interface DeleteResourcePageProps {
  title: string;
  description?: string;
  resourceLabel: string; // e.g. "position", "candidate"
  resourceName: string;
  detailsHeading: string; // e.g. "Position information"
  details: DetailItem[];
  impact?: ImpactItem[];
  cancelHref: string;
  children: ReactNode; // the *DeleteForm action component
}

// Shared shell for every /[id]/delete confirmation page. Replaces six
// near-identical hand-rolled pages with one component that owns the
// warning copy, impact summary, key/value details card, and Cancel link.
// Each call site supplies the resource-specific details + the form
// component that actually invokes the delete server action.
export function DeleteResourcePage({
  title,
  description,
  resourceLabel,
  resourceName,
  detailsHeading,
  details,
  impact,
  cancelHref,
  children,
}: Readonly<DeleteResourcePageProps>) {
  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Confirm'
        title={title}
        description={description}
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <div className='space-y-4'>
          <div>
            <h2 className='text-xl font-bold text-destructive'>Warning</h2>
            <p className='text-muted-foreground'>
              This action cannot be undone. This will permanently delete the
              {' '}
              {resourceLabel}
              <span className='font-semibold'> {resourceName} </span>
              {impact && impact.length > 0 && (
                <ImpactClause items={impact} />
              )}
              .
            </p>
          </div>

          <div className='rounded-md border border-border bg-secondary p-4'>
            <h3 className='font-semibold'>{detailsHeading}</h3>
            <div className='mt-2 space-y-1 text-sm'>
              {details
                .filter((d) => d.value !== null && d.value !== undefined && d.value !== '')
                .map((d) => (
                  <p key={d.label}>
                    <span className='text-muted-foreground'>{d.label}:</span>{' '}
                    {d.value}
                  </p>
                ))}
            </div>
          </div>

          {children}

          <div className='flex justify-end'>
            <Button variant='outline' asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactClause({ items }: Readonly<{ items: ImpactItem[] }>) {
  const visible = items.filter((i) => i.count > 0);
  if (visible.length === 0) return null;
  return (
    <>
      and affect{' '}
      {visible.map((item, i) => (
        <span key={item.label}>
          <span className='font-semibold'>{item.count}</span>{' '}
          {item.label}
          {i < visible.length - 1 ? ' and ' : ''}
        </span>
      ))}
    </>
  );
}
