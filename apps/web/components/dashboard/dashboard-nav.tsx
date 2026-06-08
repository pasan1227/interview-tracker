'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Settings,
  BarChart,
  Send,
} from 'lucide-react';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { DASHBOARD_ROUTES } from '@/routes';

interface DashboardNavProps {
  role?: OrganizationRole | null;
}

const ALL_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.MANAGER,
  OrganizationRole.INTERVIEWER,
  OrganizationRole.MEMBER,
];
const MANAGER_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.MANAGER,
];
const ADMIN_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
];

// Explicit type widening so DASHBOARD_ROUTES' `as const` literal href
// strings don't narrow the array tuple and break `roles.includes(role)`
// inference on items with a single-role list.
interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: OrganizationRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: DASHBOARD_ROUTES.root, icon: LayoutDashboard, roles: ALL_ROLES },
  { title: 'Candidates', href: DASHBOARD_ROUTES.candidates.list, icon: Users, roles: ALL_ROLES },
  { title: 'Interviews', href: DASHBOARD_ROUTES.interviews.list, icon: Calendar, roles: ALL_ROLES },
  { title: 'Feedback', href: DASHBOARD_ROUTES.feedback, icon: ClipboardList, roles: ALL_ROLES },
  { title: 'Reports', href: DASHBOARD_ROUTES.reports, icon: BarChart, roles: MANAGER_ROLES },
  { title: 'Positions', href: DASHBOARD_ROUTES.positions.list, icon: Send, roles: MANAGER_ROLES },
  { title: 'Settings', href: DASHBOARD_ROUTES.settings.root, icon: Settings, roles: ADMIN_ROLES },
];

export function filterNavItems(role?: OrganizationRole | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

interface NavListProps {
  items: NavItem[];
  onNavigate?: () => void;
}

export function NavList({ items, onNavigate }: Readonly<NavListProps>) {
  const pathname = usePathname();

  return (
    <ul className='flex flex-1 flex-col gap-0.5'>
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== DASHBOARD_ROUTES.root && pathname.startsWith(item.href));

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors',
                isActive
                  ? 'font-medium text-foreground'
                  : 'font-normal text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              style={
                isActive
                  ? { backgroundColor: 'color-mix(in oklch, var(--forest) 10%, transparent)' }
                  : undefined
              }
            >
              <span className='inline-flex items-center gap-2.5'>
                <item.icon
                  className='size-4'
                  strokeWidth={1.75}
                  style={{
                    color: isActive ? 'var(--forest)' : 'var(--muted-foreground)',
                  }}
                />
                {item.title}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className='inline-block size-1.5 rounded-full'
                  style={{ backgroundColor: 'var(--forest)' }}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function NavHelpCard() {
  return (
    <div
      className='mt-6 rounded-lg border p-3'
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--card)',
      }}
    >
      <div
        className='text-[10.5px] font-medium uppercase tracking-[0.12em]'
        style={{ color: 'var(--muted-foreground)' }}
      >
        Need help?
      </div>
      <div className='mt-1 text-[12.5px] font-medium'>
        Read the docs
      </div>
      <Link
        href='#'
        className='mt-2 inline-flex text-[12px] font-medium hover:underline'
        style={{ color: 'var(--forest)' }}
      >
        Open trust center →
      </Link>
    </div>
  );
}

export function DashboardNav({ role }: Readonly<DashboardNavProps>) {
  const items = filterNavItems(role);

  return (
    <nav
      className='hidden md:block md:w-64'
      style={{
        borderRight: '1px solid var(--border)',
        backgroundColor: 'var(--sidebar)',
      }}
    >
      <div className='sticky top-16 flex h-[calc(100vh-4rem)] flex-col px-3 py-6'>
        <div
          className='mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.18em]'
          style={{ color: 'var(--muted-foreground)' }}
        >
          Workspace
        </div>

        <NavList items={items} />

        <NavHelpCard />
      </div>
    </nav>
  );
}
