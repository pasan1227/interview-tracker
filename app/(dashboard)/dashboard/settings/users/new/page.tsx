// app/(dashboard)/dashboard/settings/users/new/page.tsx

import { PageHeader } from '@/components/dashboard/page-header';
import { UserForm } from '@/components/users/user-form-lazy';
import { requirePageRole } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function NewUserPage() {
  await requirePageRole(UserRole.ADMIN);

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='New'
        title='Add new user'
        description='Create a new user account for the interview tracking system.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <UserForm />
      </div>
    </div>
  );
}
