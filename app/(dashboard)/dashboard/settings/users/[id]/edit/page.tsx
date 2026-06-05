// app/(dashboard)/dashboard/settings/users/[id]/edit/page.tsx

import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getUserById } from '@/data/user';
import { UserForm } from '@/components/users/user-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await auth();
  const { id } = await params;


  if (!session || !session.user) {
    redirect('/login');
  }

  // Only admin can edit users
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const user = await getUserById(id);

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
