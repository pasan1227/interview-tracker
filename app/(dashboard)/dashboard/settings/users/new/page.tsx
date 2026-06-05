// app/(dashboard)/dashboard/settings/users/new/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UserForm } from '@/components/users/user-form';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function NewUserPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Only admin can add users
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Add New User</h1>
        <p className='text-muted-foreground'>
          Create a new user account for the interview tracking system
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <UserForm />
      </div>
    </div>
  );
}
