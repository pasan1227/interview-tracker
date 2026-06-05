// app/(dashboard)/dashboard/settings/users/[id]/edit/page.tsx

import { notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { getSafeUserById } from '@/data/user';
import { PageHeader } from '@/components/dashboard/page-header';
import { UserForm } from '@/components/users/user-form-lazy';
import { UserRole } from '@/lib/generated/prisma/browser';

interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  await requirePageRole(UserRole.ADMIN);
  const { id } = await params;

  const user = await getSafeUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Edit'
        title='Edit user'
        description='Update user account details.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <UserForm user={user} isEdit />
      </div>
    </div>
  );
}
