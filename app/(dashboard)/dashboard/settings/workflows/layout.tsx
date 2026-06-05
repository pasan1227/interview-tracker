// app/(dashboard)/dashboard/settings/workflows/layout.tsx

import { auth } from '@/auth';
import { UserRole } from '@/lib/generated/prisma/browser';
import { redirect } from 'next/navigation';

export default async function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to access this section
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return <div className='space-y-6'>{children}</div>;
}
