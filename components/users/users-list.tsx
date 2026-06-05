// components/users/users-list.tsx

'use client';

import Link from 'next/link';
import { User } from '@/lib/generated/prisma/browser';
import { Badge } from '@/components/ui/badge';
import { USER_ROLE_BADGE } from '@/lib/constants/status-styles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { PencilIcon, TrashIcon } from 'lucide-react';

interface UsersListProps {
  users: User[];
}

export function UsersList({ users }: UsersListProps) {
  if (users.length === 0) {
    return (
      <div className='flex h-[400px] flex-col items-center justify-center space-y-2 p-8 text-center border rounded-md'>
        <h3 className='text-lg font-semibold'>No users found</h3>
        <p className='text-sm text-muted-foreground'>
          Add users to give them access to the system
        </p>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage src={user.image || ''} alt={user.name || ''} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className='font-medium'>{user.name}</span>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge
                  variant='outline'
                  className={`${USER_ROLE_BADGE[user.role]} border-0`}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end space-x-2'>
                  <Button size='sm' variant='outline' asChild>
                    <Link href={`/dashboard/settings/users/${user.id}/edit`}>
                      <PencilIcon className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Link>
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='text-red-600'
                    asChild
                  >
                    <Link href={`/dashboard/settings/users/${user.id}/delete`}>
                      <TrashIcon className='h-4 w-4' />
                      <span className='sr-only'>Delete</span>
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
