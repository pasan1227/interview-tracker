// app/(dashboard)/settings/page.tsx

import Link from 'next/link';
import { requirePageOrgRole } from '@/lib/authz';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  ArrowUpRight,
  BriefcaseIcon,
  CheckSquareIcon,
  SlidersHorizontalIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

interface SettingsCardProps {
  href: string;
  Icon: LucideIcon;
  title: string;
  description: string;
}

function SettingsCard({
  href,
  Icon,
  title,
  description,
}: Readonly<SettingsCardProps>) {
  return (
    <Link
      href={href}
      className='group flex flex-col gap-5 rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--forest)_28%,var(--border))] hover:shadow-[0_16px_32px_-22px_rgba(14,59,46,0.18)]'
    >
      <span
        className='inline-flex size-10 items-center justify-center rounded-md border'
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--secondary)',
        }}
      >
        <Icon
          className='size-5'
          strokeWidth={1.75}
          style={{ color: 'var(--forest)' }}
        />
      </span>
      <div className='flex flex-col gap-1.5'>
        <h2 className='text-[20px] font-medium leading-[1.05] tracking-[-0.015em]'>
          {title}
        </h2>
        <p
          className='text-[14.5px] leading-[1.55]'
          style={{ color: 'var(--muted-foreground)' }}
        >
          {description}
        </p>
      </div>
      <div
        className='mt-auto inline-flex items-center gap-1.5 text-[13px] font-medium'
        style={{ color: 'var(--forest)' }}
      >
        Open
        <ArrowUpRight
          className='size-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px'
          strokeWidth={2}
        />
      </div>
    </Link>
  );
}

export default async function SettingsPage() {
  await requirePageOrgRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]);

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Workspace'
        title='Settings'
        description='Manage system settings and configurations.'
      />

      <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
        <SettingsCard
          href='/settings/members'
          Icon={UsersIcon}
          title='Members'
          description='Invite teammates, manage roles, and revoke access.'
        />
        <SettingsCard
          href='/positions'
          Icon={BriefcaseIcon}
          title='Positions'
          description='Create and configure positions available for candidates.'
        />
        <SettingsCard
          href='/settings/workflows'
          Icon={CheckSquareIcon}
          title='Interview workflows'
          description='Create and customize interview workflows with different stages.'
        />
        <SettingsCard
          href='/settings/general'
          Icon={SlidersHorizontalIcon}
          title='General settings'
          description='Configure email notifications, system preferences, and other settings.'
        />
      </div>
    </div>
  );
}
