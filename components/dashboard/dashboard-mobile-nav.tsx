'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { MenuIcon, XIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  filterNavItems,
  NavHelpCard,
  NavList,
} from '@/components/dashboard/dashboard-nav';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/generated/prisma/browser';

interface DashboardMobileNavProps {
  role?: UserRole;
}

export function DashboardMobileNav({ role }: Readonly<DashboardMobileNavProps>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = filterNavItems(role);

  // Auto-dismiss on route change (covers browser back/forward while the
  // drawer is open — NavList's onNavigate handles in-drawer clicks).
  // The ref skips the mount pass so we don't fire a noop setState on
  // first render (which is what the React Compiler warns about).
  const initialPathname = useRef(pathname);
  useEffect(() => {
    if (pathname === initialPathname.current) return;
    setOpen(false);
  }, [pathname]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
          aria-label='Open navigation menu'
        >
          <MenuIcon className='size-5' />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 md:hidden'
        />
        <DialogPrimitive.Content
          className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col px-3 py-6 shadow-xl duration-200 md:hidden'
          style={{
            borderRight: '1px solid var(--border)',
            backgroundColor: 'var(--sidebar)',
          }}
          aria-label='Main navigation'
        >
          <DialogPrimitive.Title className='sr-only'>
            Main navigation
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className='sr-only'>
            Jump between workspace areas.
          </DialogPrimitive.Description>

          <div className='mb-3 flex items-center justify-between px-3'>
            <div
              className='text-[11px] font-medium uppercase tracking-[0.18em]'
              style={{ color: 'var(--muted-foreground)' }}
            >
              Workspace
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                variant='ghost'
                size='icon'
                className='size-7'
                aria-label='Close navigation menu'
              >
                <XIcon className='size-4' />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <NavList items={items} onNavigate={() => setOpen(false)} />

          <NavHelpCard />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
