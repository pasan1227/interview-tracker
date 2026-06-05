// app/(dashboard)/dashboard/settings/users/[id]/edit/page.tsx

import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { auth } from '@/auth';
import { getSafeUserById } from '@/data/user';
import { UserForm } from '@/components/users/user-form-lazy';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth();
  const { id } = await params;


  await requirePageRole(UserRole.ADMIN);

  const user = await getSafeUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Edit User</h1>
        <p className='text-muted-foreground'>Update user account details</p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <UserForm user={user} isEdit />
      </div>
    </div>
  );
}
