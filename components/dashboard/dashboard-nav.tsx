// components/dashboard/dashboard-nav.tsx

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
import { UserRole } from '@/lib/generated/prisma/browser';

interface DashboardNavProps {
  role?: UserRole;
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: [
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.INTERVIEWER,
        UserRole.USER,
      ],
    },
    {
      title: 'Candidates',
      href: '/dashboard/candidates',
      icon: Users,
      roles: [
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.INTERVIEWER,
        UserRole.USER,
      ],
    },
    {
      title: 'Interviews',
      href: '/dashboard/interviews',
      icon: Calendar,
      roles: [
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.INTERVIEWER,
        UserRole.USER,
      ],
    },
    {
      title: 'Feedback',
      href: '/dashboard/feedback',
      icon: ClipboardList,
      roles: [
        UserRole.ADMIN,
        UserRole.MANAGER,
        UserRole.INTERVIEWER,
        UserRole.USER,
      ],
    },
    {
      title: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart,
      roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
      title: 'Positions',
      href: '/dashboard/positions',
      icon: Send,
      roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      roles: [UserRole.ADMIN],
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(role as UserRole)
  );

  return (
    <nav className='hidden border-r bg-white md:block md:w-64'>
      <div className='flex h-full flex-col px-4 py-6'>
        <div className='space-y-1'>
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className='h-5 w-5' />
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
