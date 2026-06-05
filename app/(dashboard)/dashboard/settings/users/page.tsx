// app/(dashboard)/dashboard/settings/users/page.tsx

import Link from 'next/link';
import { requirePageRole } from '@/lib/authz';
import { getSafeUsers } from '@/data/user';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { UsersList } from '@/components/users/users-list';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function UsersPage() {
  await requirePageRole(UserRole.ADMIN);

  const users = await getSafeUsers({ includeAdmins: true });

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>User Management</h1>
          <p className='text-muted-foreground'>
            Manage user accounts and access levels
          </p>
        </div>
        <Button asChild>
          <Link href='/dashboard/settings/users/new'>
            <PlusIcon className='mr-2 h-4 w-4' />
            Add User
          </Link>
        </Button>
      </div>

      <UsersList users={users} />
    </div>
  );
}
