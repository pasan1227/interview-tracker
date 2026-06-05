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
import { getWorkflows } from '@/data/workflow';
import { formatDate } from '@/lib/utils';
import { ExternalLinkIcon, PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';

export async function WorkflowsList() {
  const workflows = await getWorkflows();

  if (workflows.length === 0) {
    return (
      <ListEmptyState
        bordered
        title='No workflows found'
        description='Create a workflow to get started'
      />
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workflow Name</TableHead>
            <TableHead>Stages</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows.map((workflow) => (
            <TableRow key={workflow.id}>
              <TableCell className='font-medium'>{workflow.name}</TableCell>
              <TableCell>{workflow.stages.length} stages</TableCell>
              <TableCell>
                {workflow.isDefault ? (
                  <Badge
                    variant='outline'
                    className='bg-green-50 text-green-600 border-0'
                  >
                    Default
                  </Badge>
                ) : (
                  <Badge
                    variant='outline'
                    className='bg-slate-50 text-slate-600 border-0'
                  >
                    Custom
                  </Badge>
                )}
              </TableCell>
              <TableCell>{formatDate(workflow.createdAt)}</TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end space-x-2'>
                  <Button size='sm' variant='outline' asChild>
                    <Link href={`/dashboard/settings/workflows/${workflow.id}`}>
                      <ExternalLinkIcon className='h-4 w-4' />
                      <span className='sr-only'>View</span>
                    </Link>
                  </Button>
                  <Button size='sm' variant='outline' asChild>
                    <Link
                      href={`/dashboard/settings/workflows/${workflow.id}/edit`}
                    >
                      <PencilIcon className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Link>
                  </Button>
                  {!workflow.isDefault && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='text-red-600'
                      asChild
                    >
                      <Link
                        href={`/dashboard/settings/workflows/${workflow.id}/delete`}
                      >
                        <TrashIcon className='h-4 w-4' />
                        <span className='sr-only'>Delete</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
