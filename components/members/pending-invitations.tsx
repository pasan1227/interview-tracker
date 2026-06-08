import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrganizationRole } from '@/lib/generated/prisma/browser';
import { formatDate } from '@/lib/utils';

type Invitation = {
  id: string;
  email: string;
  role: OrganizationRole;
  expires: Date;
  invitedBy: { name: string | null; email: string };
};

export function PendingInvitations({
  invitations,
}: {
  invitations: Invitation[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Invited by</TableHead>
          <TableHead>Expires</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell>{inv.email}</TableCell>
            <TableCell>
              <Badge variant='outline'>{inv.role}</Badge>
            </TableCell>
            <TableCell>{inv.invitedBy.name ?? inv.invitedBy.email}</TableCell>
            <TableCell>{formatDate(inv.expires)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
