// app/(dashboard)/dashboard/settings/users/new/page.tsx

import { UserForm } from '@/components/users/user-form';
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

      <div className='rounded-md border p-6 bg-white'>
        <UserForm />
      </div>
    </div>
  );
}
