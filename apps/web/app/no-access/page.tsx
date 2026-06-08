// Landing for users with zero org memberships. PR 12 makes signup
// invite-only, so this page is the dead-end for anyone who arrives
// without one. The "ask for an invitation" copy points them at the
// human path; there's no self-serve org creation in v1.

import { signOut } from '@/auth';
import { requireSession } from '@/lib/authz';

export default async function NoAccessPage() {
  const user = await requireSession();

  return (
    <div className='mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16'>
      <div className='rounded-xl border border-border bg-card p-8'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          No organization yet
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Your account ({user.email}) isn&apos;t a member of any organization
          yet. InterviewPro is invite-only — ask an admin from your team to
          send you an invitation.
        </p>
        <p className='mt-4 text-xs text-muted-foreground'>
          If you already accepted an invitation, sign out and back in to
          refresh your session.
        </p>

        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
          className='mt-6 border-t border-border pt-4'
        >
          <button
            type='submit'
            className='text-xs text-muted-foreground hover:text-foreground'
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
