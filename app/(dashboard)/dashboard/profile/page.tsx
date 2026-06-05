// app/(dashboard)/dashboard/profile/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageHeader } from '@/components/dashboard/page-header';
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
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Account'
        title='My profile'
        description='Manage your account settings.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        {/* @ts-expect-error Server Component */}
        <UserProfileForm user={user} />
      </div>
    </div>
  );
}
