// /invitations/accept?token=...
//
// Two states:
// 1. Not signed in — bounce to /login with a callbackUrl back here.
// 2. Signed in — show a confirmation card with org + role; the form
//    posts to acceptInvitation, which flips the JWT to the new org
//    and redirects to /dashboard.

import { acceptInvitation } from '@/actions/org/accept-invitation';
import { signOut } from '@/auth';
import { getInvitationByToken } from '@/data/tokens';
import { getUserByEmail } from '@/data/user';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

interface AcceptPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitationPage({
  searchParams,
}: AcceptPageProps) {
  const { token } = await searchParams;
  if (!token) return <Card>Missing invitation token.</Card>;

  const session = await getSession();
  if (!session?.user) {
    // No session — figure out whether the invited email already has an
    // account. If yes, send them through /login (they'll come back).
    // If not, send them through /register so they can create one with
    // the invitation prefilled.
    const invitation = await getInvitationByToken(token);
    if (!invitation) return <Card>Invitation not found or already used.</Card>;
    const existing = await getUserByEmail(invitation.email);
    if (existing) {
      redirect(
        `/login?callbackUrl=${encodeURIComponent(`/invitations/accept?token=${token}`)}`
      );
    }
    redirect(`/register?invitationToken=${encodeURIComponent(token)}`);
  }

  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return <Card>Invitation not found or already used.</Card>;
  }
  if (invitation.expires < new Date()) {
    return <Card>This invitation expired. Ask for a new one.</Card>;
  }

  if (
    invitation.email.toLowerCase() !== (session.user.email ?? '').toLowerCase()
  ) {
    return (
      <Card>
        This invitation was sent to <strong>{invitation.email}</strong> but
        you're signed in as <strong>{session.user.email}</strong>. Sign out
        and back in with the right account.
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: `/login?callbackUrl=${encodeURIComponent(`/invitations/accept?token=${token}`)}` });
          }}
          className='mt-4'
        >
          <button
            type='submit'
            className='text-xs underline text-muted-foreground hover:text-foreground'
          >
            Sign out
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className='text-2xl font-semibold tracking-tight'>
        Join {invitation.organization.name}
      </h1>
      <p className='mt-2 text-sm text-muted-foreground'>
        {invitation.invitedBy.name ?? invitation.invitedBy.email} invited you
        as <strong>{invitation.role.toLowerCase()}</strong>.
      </p>
      <form
        action={async () => {
          'use server';
          await acceptInvitation(token);
        }}
        className='mt-6'
      >
        <button
          type='submit'
          className='w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background'
        >
          Accept invitation
        </button>
      </form>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className='mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16'>
      <div className='rounded-xl border border-border bg-card p-8'>
        {children}
      </div>
    </div>
  );
}
