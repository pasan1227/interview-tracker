'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Narrow to the fields the header actually reads. Accepts both the
// next-auth session user (no createdAt/updatedAt) and a Prisma User.
interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function Logomark() {
  return (
    <span
      aria-hidden
      className='relative inline-flex size-7 items-center justify-center rounded-md'
      style={{ backgroundColor: 'var(--forest)' }}
    >
      <span
        className='block size-3 rounded-[3px]'
        style={{
          background:
            'conic-gradient(from 135deg, var(--bone), var(--bone) 25%, transparent 25%, transparent 50%, var(--bone) 50%, var(--bone) 75%, transparent 75%)',
        }}
      />
    </span>
  );
}

export function DashboardHeader({ user }: Readonly<DashboardHeaderProps>) {
  const userInitials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <header
      className='sticky top-0 z-20 backdrop-blur-md'
      style={{
        backgroundColor: 'color-mix(in oklch, var(--background) 78%, transparent)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className='mx-auto flex h-16 items-center justify-between px-6 lg:px-10'>
        <Link href='/dashboard' className='flex items-center gap-2.5'>
          <Logomark />
          <span className='text-[16px] font-semibold tracking-[-0.01em]'>
            InterviewPro
          </span>
        </Link>

        <div className='flex items-center gap-3'>
          <div
            className='hidden items-center gap-2 text-[12px] md:flex'
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span
              className='inline-block size-1.5 rounded-full'
              style={{ backgroundColor: 'var(--status-ok)' }}
            />
            All systems operational
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='relative h-10 w-10 rounded-full p-0'
              >
                <Avatar className='size-9 border border-border'>
                  <AvatarImage
                    src={user?.image || ''}
                    alt={user?.name || 'User'}
                  />
                  <AvatarFallback
                    className='text-[12.5px] font-semibold'
                    style={{
                      backgroundColor: 'var(--forest)',
                      color: 'var(--bone)',
                    }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-60'>
              <div className='flex items-center gap-3 px-2 py-2'>
                <Avatar className='size-9 border border-border'>
                  <AvatarFallback
                    className='text-[12.5px] font-semibold'
                    style={{
                      backgroundColor: 'var(--forest)',
                      color: 'var(--bone)',
                    }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  {user?.name && (
                    <p className='truncate text-sm font-medium leading-tight'>
                      {user.name}
                    </p>
                  )}
                  {user?.email && (
                    <p className='truncate text-xs text-muted-foreground'>
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href='/dashboard/profile'>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/dashboard/settings'>Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='cursor-pointer'
                onSelect={(event) => {
                  event.preventDefault();
                  signOut({ callbackUrl: '/login' });
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
