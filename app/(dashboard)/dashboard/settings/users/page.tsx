// app/(dashboard)/dashboard/settings/users/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import { getSafeUsers } from '@/data/user';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { UsersList } from '@/components/users/users-list';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function UsersPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Only admin can access user management
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

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
