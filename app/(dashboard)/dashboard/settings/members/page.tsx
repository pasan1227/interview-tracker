// app/(dashboard)/dashboard/settings/members/page.tsx
//
// Replaces the legacy /settings/users page. Lists active members +
// pending invitations for the current org; admins can invite, revoke,
// and (PR 12) demote/promote roles.

import { PageHeader } from '@/components/dashboard/page-header';
import { InviteMemberForm } from '@/components/members/invite-member-form';
import { MembersTable } from '@/components/members/members-table';
import { PendingInvitations } from '@/components/members/pending-invitations';
import { getOrgInvitations, getOrgMembers } from '@/data/org';
import { requirePageOrgRole, toOrgContext } from '@/lib/authz';
import { OrganizationRole } from '@/lib/generated/prisma/browser';

export default async function MembersPage() {
  const user = await requirePageOrgRole([
    OrganizationRole.OWNER,
    OrganizationRole.ADMIN,
  ]);
  const ctx = toOrgContext(user);

  const [members, invitations] = await Promise.all([
    getOrgMembers(ctx),
    getOrgInvitations(ctx),
  ]);

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-6'>
      <PageHeader
        eyebrow='Settings'
        title='Members'
        description='Invite teammates and manage who has access to this organization.'
      />

      <div className='rounded-xl border border-border bg-card p-6'>
        <h2 className='mb-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground'>
          Invite a teammate
        </h2>
        <InviteMemberForm />
      </div>

      <div className='rounded-xl border border-border bg-card p-6'>
        <h2 className='mb-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground'>
          Active members ({members.length})
        </h2>
        <MembersTable members={members} currentUserId={user.id} />
      </div>

      {invitations.length > 0 && (
        <div className='rounded-xl border border-border bg-card p-6'>
          <h2 className='mb-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground'>
            Pending invitations ({invitations.length})
          </h2>
          <PendingInvitations invitations={invitations} />
        </div>
      )}
    </div>
  );
}
