'use client';

import dynamic from 'next/dynamic';

// @dnd-kit/core + sortable + utilities are only needed when the page is
// interactive. Lazy-loading them shaves the runtime + listeners off the
// initial workflow-detail bundle. ssr:false matches dnd-kit's
// browser-only sensors; loading state matches the post-mount layout.
export const WorkflowStages = dynamic(
  () => import('./workflow-stages').then((m) => m.WorkflowStages),
  {
    ssr: false,
    loading: () => (
      <div className='space-y-3' aria-hidden>
        <div className='h-24 rounded-md border border-border bg-card' />
        <div className='h-24 rounded-md border border-border bg-card' />
        <div className='h-24 rounded-md border border-border bg-card' />
      </div>
    ),
  }
);
