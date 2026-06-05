// app/(dashboard)/dashboard/profile/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { UserProfileForm } from '@/components/users/user-profile-form';
import { getCurrentUser } from '@/lib/session';

export default async function ProfilePage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>My Profile</h1>
        <p className='text-muted-foreground'>Manage your account settings</p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        {/* @ts-expect-error Server Component */}
        <UserProfileForm user={user} />
      </div>
    </div>
  );
}
