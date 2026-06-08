'use client';

import { revokeMembership } from '@/actions/org/revoke-membership';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MembershipStatus,
  OrganizationRole,
} from '@/lib/generated/prisma/browser';
import { useState, useTransition } from 'react';

type Member = {
  id: string;
  role: OrganizationRole;
  status: MembershipStatus;
  acceptedAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export function MembersTable({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (members.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        No members yet — invite a teammate above to get started.
      </p>
    );
  }

  return (
    <div className='space-y-3'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell className='font-medium'>
                {m.user.name ?? '—'}
                {m.user.id === currentUserId && (
                  <span className='ml-2 text-xs text-muted-foreground'>(you)</span>
                )}
              </TableCell>
              <TableCell>{m.user.email}</TableCell>
              <TableCell>
                <Badge variant='outline'>{m.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={m.status === 'ACTIVE' ? 'default' : 'outline'}>
                  {m.status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className='text-right'>
                {m.role !== OrganizationRole.OWNER &&
                  m.user.id !== currentUserId && (
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={isPending || m.status !== 'ACTIVE'}
                      onClick={() =>
                        startTransition(async () => {
                          setError(null);
                          try {
                            await revokeMembership(m.id);
                          } catch (e) {
                            setError(
                              e instanceof Error
                                ? e.message
                                : 'Failed to revoke'
                            );
                          }
                        })
                      }
                    >
                      Revoke
                    </Button>
                  )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
