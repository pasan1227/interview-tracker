// app/(dashboard)/dashboard/settings/users/[id]/delete/page.tsx (continued)

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getUserById } from '@/data/user';
import { Button } from '@/components/ui/button';
import { UserDeleteForm } from '@/components/users/user-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface DeleteUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DeleteUserPage({ params }: DeleteUserPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session || !session.user) {
    redirect('/login');
  }

  // Only admin can delete users
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  // Prevent deleting yourself
  if (user.id === session.user.id) {
    redirect('/dashboard/settings/users');
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Delete User</h1>
        <p className='text-muted-foreground'>
          Are you sure you want to delete this user?
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <div className='space-y-4'>
          <div>
            <h2 className='text-xl font-bold text-red-600'>Warning</h2>
            <p className='text-muted-foreground'>
              This action cannot be undone. This will permanently delete the
              user
              <span className='font-semibold'> {user.name} </span>
              and remove their access to the system.
            </p>
          </div>

          <div className='border rounded-md p-4 bg-slate-50'>
            <h3 className='font-semibold'>User Information</h3>
            <div className='mt-2 space-y-1 text-sm'>
              <p>
                <span className='text-muted-foreground'>Name:</span> {user.name}
              </p>
              <p>
                <span className='text-muted-foreground'>Email:</span>{' '}
                {user.email}
              </p>
              <p>
                <span className='text-muted-foreground'>Role:</span> {user.role}
              </p>
            </div>
          </div>

          <UserDeleteForm userId={user.id} />

          <div className='flex justify-end'>
            <Button variant='outline' asChild>
              <Link href='/dashboard/settings/users'>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
