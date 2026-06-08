'use client';

import dynamic from 'next/dynamic';

// Dynamic-imported wrapper so the recharts bundle (~95KB gzipped) only ships
// for users who actually see the manager dashboard. ssr:false avoids hydration
// cost and matches recharts' client-only rendering. Loading state mirrors the
// final grid layout to prevent CLS.
export const DashboardCharts = dynamic(
  () => import('./dashboard-charts').then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3' aria-hidden>
        <div className='h-[26rem] rounded-xl border border-border bg-card' />
        <div className='h-[26rem] rounded-xl border border-border bg-card' />
        <div className='h-[26rem] rounded-xl border border-border bg-card' />
        <div className='h-80 rounded-xl border border-border bg-card md:col-span-2 lg:col-span-3' />
      </div>
    ),
  }
);
