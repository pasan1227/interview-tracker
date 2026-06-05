// app/(dashboard)/dashboard/settings/users/page.tsx

import Link from 'next/link';
import { requirePageRole } from '@/lib/authz';
import { getSafeUsers } from '@/data/user';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { UsersList } from '@/components/users/users-list';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function UsersPage() {
  await requirePageRole(UserRole.ADMIN);

  const users = await getSafeUsers({ includeAdmins: true });

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Settings'
        title='User management'
        description='Manage user accounts and access levels.'
        action={
          <Button asChild>
            <Link href='/dashboard/settings/users/new'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Add user
            </Link>
          </Button>
        }
      />

      <UsersList users={users} />
    </div>
  );
}
