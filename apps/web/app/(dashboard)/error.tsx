'use client';

// Segment-level error boundary for the (dashboard) route group. Catches
// runtime errors thrown anywhere under /dashboard so a single failed
// fetch in one tab doesn't paint a Next.js dev overlay over the whole
// app. The DashboardHeader/Nav above this boundary keep rendering.

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/page-header';
import { AlertCircleIcon, RotateCwIcon } from 'lucide-react';
import { useEffect } from 'react';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({
  error,
  reset,
}: Readonly<DashboardErrorProps>) {
  useEffect(() => {
    console.error('Dashboard error boundary caught:', error);
  }, [error]);

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Error'
        title='Something went wrong'
        description='An unexpected error occurred. You can try the action again or head back to the dashboard.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <div className='flex items-start gap-3'>
          <span
            aria-hidden
            className='mt-0.5 inline-flex size-9 flex-none items-center justify-center rounded-md'
            style={{
              backgroundColor: 'var(--badge-danger-bg)',
              color: 'var(--badge-danger-fg)',
            }}
          >
            <AlertCircleIcon className='size-5' strokeWidth={1.75} />
          </span>
          <div className='flex flex-col gap-2'>
            <p className='text-sm font-medium'>
              {error.message || 'An unexpected error occurred.'}
            </p>
            {error.digest && (
              <p className='text-xs text-muted-foreground'>
                Reference: {error.digest}
              </p>
            )}
            <div className='mt-2 flex flex-wrap gap-2'>
              <Button onClick={reset} size='sm'>
                <RotateCwIcon className='mr-2 size-3.5' strokeWidth={2} />
                Try again
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => (window.location.href = '/')}
              >
                Back to dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
