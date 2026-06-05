// app/(dashboard)/dashboard/settings/workflows/layout.tsx

import { UserRole } from '@/lib/generated/prisma/browser';
import { requirePageRole } from '@/lib/authz';
export default async function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(UserRole.ADMIN);

  return <div className='space-y-6'>{children}</div>;
}
