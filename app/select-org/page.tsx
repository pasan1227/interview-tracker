// Org chooser for users who belong to multiple orgs. Middleware
// routes here when activeOrgId is null and orgs.length > 1.

import { redirect } from 'next/navigation';
import { switchActiveOrg } from '@/actions/org/switch-org';
import { signOut } from '@/auth';
import { getActiveMembershipsForUser } from '@/data/membership';
import { requireSession } from '@/lib/authz';

export default async function SelectOrgPage() {
  const user = await requireSession();
  const orgs = await getActiveMembershipsForUser(user.id);

  // If they actually have zero, the no-access page is the right
  // destination. (Middleware already does this, but a direct hit
  // here without going through middleware lands cleanly.)
  if (orgs.length === 0) redirect('/no-access');

  return (
    <div className='mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16'>
      <div className='rounded-xl border border-border bg-card p-8'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Choose an organization
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          You belong to {orgs.length} organizations. Pick the one you want to
          work in. You can switch any time from the workspace menu.
        </p>

        <ul className='mt-6 flex flex-col gap-2'>
          {orgs.map((org) => (
            <li key={org.id}>
              <form
                action={async () => {
                  'use server';
                  await switchActiveOrg(org.id);
                }}
              >
                <button
                  type='submit'
                  className='flex w-full items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-left transition hover:bg-muted'
                >
                  <span>
                    <span className='block text-sm font-medium'>{org.name}</span>
                    <span className='block text-xs text-muted-foreground'>
                      {org.slug} · {org.role.toLowerCase()}
                    </span>
                  </span>
                  <span aria-hidden className='text-muted-foreground'>
                    →
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>

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
