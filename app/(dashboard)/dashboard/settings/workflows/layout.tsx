// app/(dashboard)/dashboard/settings/workflows/layout.tsx

import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { requirePageOrgRole } from '@/lib/authz';
export default async function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageOrgRole([OrganizationRole.OWNER, OrganizationRole.ADMIN]);

  return <div className='space-y-6'>{children}</div>;
}
