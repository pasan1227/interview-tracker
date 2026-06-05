// app/(dashboard)/dashboard/settings/layout.tsx

import { auth } from '@/auth';
import { UserRole } from '@/lib/generated/prisma/browser';
import { redirect } from 'next/navigation';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Only admin can access settings
  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div className='space-y-6'>
      {/* <SettingsTabs /> */}
      {children}
    </div>
  );
}

// function SettingsTabs() {
//   return (
//     <Tabs defaultValue='general' className='w-full'>
//       <TabsList className='grid w-full grid-cols-3'>
//         <TabsTrigger value='general' asChild>
//           <Link href='/dashboard/settings/general'>General</Link>
//         </TabsTrigger>
//         <TabsTrigger value='users' asChild>
//           <Link href='/dashboard/settings/users'>Users</Link>
//         </TabsTrigger>
//         <TabsTrigger value='workflows' asChild>
//           <Link href='/dashboard/settings/workflows'>Workflows</Link>
//         </TabsTrigger>
//       </TabsList>
//     </Tabs>
//   );
// }
