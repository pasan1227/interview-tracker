'use client';

import { Card, CardContent } from '@/components/ui/card';
import { DashboardStats } from '@/data/dashboard';
import {
  BadgeCheckIcon,
  CalendarIcon,
  TimerIcon,
  UsersIcon,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DashboardSummaryProps {
  stats: DashboardStats;
}

interface StatCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  footnote: string;
  delta?: number;
}

function StatCard({ label, value, Icon, footnote, delta }: Readonly<StatCardProps>) {
  const hasDelta = typeof delta === 'number';
  const isUp = (delta ?? 0) > 0;
  return (
    <Card className='rounded-xl border-border bg-card shadow-none transition-shadow hover:shadow-[0_1px_0_rgba(0,0,0,0.02),0_16px_32px_-22px_rgba(14,59,46,0.14)]'>
      <CardContent className='flex flex-col gap-4 p-5'>
        <div className='flex items-start justify-between'>
          <span
            className='text-[12px] font-medium uppercase tracking-[0.12em]'
            style={{ color: 'var(--muted-foreground)' }}
          >
            {label}
          </span>
          <span
            className='inline-flex size-8 items-center justify-center rounded-md border'
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}
          >
            <Icon className='size-4' strokeWidth={1.75} style={{ color: 'var(--forest)' }} />
          </span>
        </div>
        <div className='flex items-end justify-between gap-2'>
          <div className='text-[28px] font-semibold leading-none tracking-[-0.025em]'>
            {value}
          </div>
          {hasDelta && (
            <span
              className='inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium'
              style={{
                backgroundColor: isUp
                  ? 'color-mix(in oklch, var(--forest) 10%, transparent)'
                  : 'color-mix(in oklch, #A86510 10%, transparent)',
                color: isUp ? 'var(--forest)' : '#A86510',
              }}
            >
              {isUp ? <TrendingUp className='size-3' /> : <TrendingDown className='size-3' />}
              {isUp ? '+' : ''}
              {delta}%
            </span>
          )}
        </div>
        <div className='text-[12.5px]' style={{ color: 'var(--muted-foreground)' }}>
          {footnote}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSummary({ stats }: Readonly<DashboardSummaryProps>) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        label='Total candidates'
        value={stats.totalCandidates}
        Icon={UsersIcon}
        footnote='Active pipeline'
        delta={stats.candidateChange}
      />
      <StatCard
        label='Scheduled interviews'
        value={stats.scheduledInterviews}
        Icon={CalendarIcon}
        footnote='Next 7 days'
      />
      <StatCard
        label='Completed interviews'
        value={stats.completedInterviews}
        Icon={BadgeCheckIcon}
        footnote='Last 30 days'
      />
      <StatCard
        label='Avg. time to hire'
        value={`${stats.avgTimeToHire} days`}
        Icon={TimerIcon}
        footnote='Trailing quarter'
        delta={stats.timeToHireChange}
      />
    </div>
  );
}
