// app/(dashboard)/dashboard/settings/users/[id]/delete/page.tsx

import { redirect, notFound } from 'next/navigation';
import { requirePageRole } from '@/lib/authz';
import { getSafeUserById } from '@/data/user';
import { DeleteResourcePage } from '@/components/dashboard/delete-resource-page';
import { UserDeleteForm } from '@/components/users/user-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

interface DeleteUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteUserPageRoute({
  params,
}: DeleteUserPageProps) {
  const actor = await requirePageRole(UserRole.ADMIN);
  const { id } = await params;

  const user = await getSafeUserById(id);
  if (!user) notFound();

  // Prevent deleting yourself.
  if (user.id === actor.id) redirect('/dashboard/settings/users');

  return (
    <DeleteResourcePage
      title='Delete user'
      description='Are you sure you want to delete this user?'
      resourceLabel='user'
      resourceName={user.name ?? user.email}
      detailsHeading='User information'
      details={[
        { label: 'Name', value: user.name },
        { label: 'Email', value: user.email },
        { label: 'Role', value: user.role },
      ]}
      cancelHref='/dashboard/settings/users'
    >
      <UserDeleteForm userId={user.id} />
    </DeleteResourcePage>
  );
}
