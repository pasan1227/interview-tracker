// components/dashboard/dashboard-header.tsx

'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/generated/prisma/browser';

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const userInitials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <header className='sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6'>
      <Link href='/dashboard' className='flex items-center gap-2'>
        <span className='text-xl font-bold'>Interview Tracker</span>
      </Link>
      <div className='flex items-center gap-4'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='relative h-10 w-10 rounded-full'>
              <Avatar>
                <AvatarImage
                  src={user?.image || ''}
                  alt={user?.name || 'User'}
                />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <div className='flex items-center justify-start gap-2 p-2'>
              <div className='flex flex-col space-y-1 leading-none'>
                {user?.name && <p className='font-medium'>{user.name}</p>}
                {user?.email && (
                  <p className='w-[200px] truncate text-sm text-muted-foreground'>
                    {user.email}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuItem asChild>
              <Link href='/dashboard/profile'>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/dashboard/settings'>Settings</Link>
            </DropdownMenuItem>
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
    </header>
  );
}
