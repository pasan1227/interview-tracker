import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListEmptyState } from '@/components/ui/list-empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPositions } from '@/data/position';
import {
  POSITION_ACTIVE_BADGE,
  POSITION_INACTIVE_BADGE,
} from '@/lib/constants/status-styles';
import { formatDate } from '@/lib/utils';
import { PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';

export async function PositionsList() {
  const positions = await getPositions({
    activeOnly: false,
    includeWorkflow: true,
  });

  if (positions.length === 0) {
    return (
      <ListEmptyState
        bordered
        title='No positions found'
        description='Create a position to get started'
      />
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Workflow</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
              <TableCell className='font-medium'>{position.title}</TableCell>
              <TableCell>{position.department || '—'}</TableCell>
              <TableCell>{position.workflow?.name || '—'}</TableCell>
              <TableCell>
                {position.isActive ? (
                  <Badge
                    variant='outline'
                    style={POSITION_ACTIVE_BADGE}
                    className='border-0'
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant='outline'
                    style={POSITION_INACTIVE_BADGE}
                    className='border-0'
                  >
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>{formatDate(position.createdAt)}</TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end space-x-2'>
                  <Button size='sm' variant='outline' asChild>
                    <Link href={`/dashboard/positions/${position.id}/edit`}>
                      <PencilIcon className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Link>
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='text-destructive'
                    asChild
                  >
                    <Link href={`/dashboard/positions/${position.id}/delete`}>
                      <TrashIcon className='h-4 w-4' />
                      <span className='sr-only'>Delete</span>
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
