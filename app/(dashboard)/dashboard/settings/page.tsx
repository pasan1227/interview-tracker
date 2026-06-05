// app/(dashboard)/dashboard/settings/page.tsx

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  UsersIcon,
  BriefcaseIcon,
  CheckSquareIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { UserRole } from '@/lib/generated/prisma/browser';

export default async function SettingsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user has permission to access this page
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Settings</h1>
        <p className='text-muted-foreground'>
          Manage system settings and configurations
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <UsersIcon className='h-6 w-6 text-muted-foreground' />
            <CardTitle className='mt-2'>User Management</CardTitle>
            <CardDescription>Manage users and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Add, edit, or deactivate user accounts. Assign roles and
              permissions.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href='/dashboard/settings/users'>Manage Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <BriefcaseIcon className='h-6 w-6 text-muted-foreground' />
            <CardTitle className='mt-2'>Positions</CardTitle>
            <CardDescription>Manage job positions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Create and configure positions available for candidates.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href='/dashboard/positions'>Manage Positions</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CheckSquareIcon className='h-6 w-6 text-muted-foreground' />
            <CardTitle className='mt-2'>Interview Workflows</CardTitle>
            <CardDescription>Configure interview processes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Create and customize interview workflows with different stages.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href='/dashboard/settings/workflows'>Manage Workflows</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <SlidersHorizontalIcon className='h-6 w-6 text-muted-foreground' />
            <CardTitle className='mt-2'>General Settings</CardTitle>
            <CardDescription>System-wide configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Configure email notifications, system preferences, and other
              settings.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href='/dashboard/settings/general'>Configure Settings</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
