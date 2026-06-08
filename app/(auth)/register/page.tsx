// /register?invitationToken=...
//
// PR 12: signup is invite-only. The page reads invitationToken from
// the query string, resolves the invitation server-side, and prefills
// the email. Without a valid token, it shows the "invite-only" message
// and a link to sign in.

import { getInvitationByToken } from '@/data/tokens';
import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';

interface RegisterPageProps {
  searchParams: Promise<{ invitationToken?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { invitationToken } = await searchParams;

  if (!invitationToken) {
    return (
      <div className='w-full max-w-[420px]'>
        <div className='rounded-xl border border-border bg-card p-6'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Invite-only
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            InterviewPro is currently available by invitation. Ask a team
            admin to send you one, then follow the link in your email.
          </p>
          <p className='mt-6 text-xs text-muted-foreground'>
            Already have an account?{' '}
            <Link href='/login' className='underline'>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const invitation = await getInvitationByToken(invitationToken);
  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expires < new Date()
  ) {
    return (
      <div className='w-full max-w-[420px]'>
        <div className='rounded-xl border border-border bg-card p-6'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Invitation expired
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            This invitation link is no longer valid. Ask your team admin to
            send a new one.
          </p>
          <p className='mt-6 text-xs text-muted-foreground'>
            <Link href='/login' className='underline'>
              Sign in
            </Link>{' '}
            to an existing account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-[420px]'>
      <RegisterForm
        invitationToken={invitationToken}
        invitedEmail={invitation.email}
        orgName={invitation.organization.name}
      />
    </div>
  );
}
