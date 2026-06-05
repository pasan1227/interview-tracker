import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListEmptyState } from '@/components/ui/list-empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { USER_ROLE_BADGE } from '@/lib/constants/status-styles';
import type { SafeUserListItem } from '@/data/user';
import { formatDate } from '@/lib/utils';
import { PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';

interface UsersListProps {
  users: SafeUserListItem[];
}

export function UsersList({ users }: Readonly<UsersListProps>) {
  if (users.length === 0) {
    return (
      <ListEmptyState
        bordered
        title='No users found'
        description='Add users to give them access to the system'
      />
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
                  style={USER_ROLE_BADGE[user.role]}
                  className='border-0'
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
