'use client';

import { inviteMember } from '@/actions/org/invite-member';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrganizationRole } from '@/lib/generated/prisma/browser';
import { useState, useTransition } from 'react';

// OWNER is excluded — the inviteMember server action rejects it.
const ASSIGNABLE_ROLES: OrganizationRole[] = [
  OrganizationRole.ADMIN,
  OrganizationRole.MANAGER,
  OrganizationRole.INTERVIEWER,
  OrganizationRole.MEMBER,
];

export function InviteMemberForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>(OrganizationRole.MEMBER);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const { email: invited } = await inviteMember({ email, role });
        setSuccess(`Invitation sent to ${invited}`);
        setEmail('');
        setRole(OrganizationRole.MEMBER);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send invitation');
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <div className='grid gap-4 sm:grid-cols-[1fr_180px_auto]'>
        <div>
          <Label htmlFor='invite-email'>Email</Label>
          <Input
            id='invite-email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='teammate@company.com'
          />
        </div>
        <div>
          <Label htmlFor='invite-role'>Role</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as OrganizationRole)}
          >
            <SelectTrigger id='invite-role'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-end'>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Sending…' : 'Send invite'}
          </Button>
        </div>
      </div>
    </form>
  );
}
