// app/(dashboard)/profile/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageHeader } from '@/components/dashboard/page-header';
import { UserProfileForm } from '@/components/users/user-profile-form';
import { getSafeUserById } from '@/data/user';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await getSafeUserById(session.user.id);

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
        <UserProfileForm user={{ id: user.id, name: user.name }} />
      </div>
    </div>
  );
}
