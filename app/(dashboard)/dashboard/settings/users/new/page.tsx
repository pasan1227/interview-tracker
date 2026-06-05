// app/(dashboard)/dashboard/settings/users/new/page.tsx

import { UserForm } from '@/components/users/user-form-lazy';
import { requirePageRole } from '@/lib/authz';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function NewUserPage() {
  await requirePageRole(UserRole.ADMIN);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Add New User</h1>
        <p className='text-muted-foreground'>
          Create a new user account for the interview tracking system
        </p>
      </div>

      <div className='rounded-xl border border-border bg-card p-6'>
        <UserForm />
      </div>
    </div>
  );
}
