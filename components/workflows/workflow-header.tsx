// components/workflows/workflow-header.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { PencilIcon, TrashIcon, CheckCircleIcon } from 'lucide-react';
import { setWorkflowAsDefault } from '@/actions/workflow';
import { WORKFLOW_DEFAULT_BADGE } from '@/lib/constants/status-styles';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Workflow } from '@/lib/generated/prisma/browser';

interface WorkflowWithStages extends Workflow {
  stages: { id: string; name: string; order: number }[];
}

interface WorkflowHeaderProps {
  workflow: WorkflowWithStages;
}

export function WorkflowHeader({ workflow }: WorkflowHeaderProps) {
  const router = useRouter();
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  async function handleSetDefault() {
    if (workflow.isDefault) return;

    setIsSettingDefault(true);

    try {
      await setWorkflowAsDefault(workflow.id);
      router.refresh();
    } catch (error) {
      console.error('Failed to set as default:', error);
    } finally {
      setIsSettingDefault(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>{workflow.name}</CardTitle>
          {workflow.isDefault && (
            <Badge style={WORKFLOW_DEFAULT_BADGE} className='border-0'>
              Default Workflow
            </Badge>
          )}
        </div>
        <CardDescription>
          {workflow.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='text-sm'>
            <span className='text-muted-foreground'>Created on:</span>{' '}
            {formatDate(workflow.createdAt)}
          </div>
          <div className='text-sm'>
            <span className='text-muted-foreground'>Stages:</span>{' '}
            {workflow.stages.length}
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex justify-between'>
        <div>
          {!workflow.isDefault && (
            <Button
              variant='outline'
              size='sm'
              onClick={handleSetDefault}
              disabled={isSettingDefault}
            >
              {isSettingDefault ? (
                <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircleIcon className='mr-2 h-4 w-4' />
              )}
              Set as Default
            </Button>
          )}
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/dashboard/settings/workflows/${workflow.id}/edit`}>
              <PencilIcon className='mr-2 h-4 w-4' />
              Edit
            </Link>
          </Button>

          {!workflow.isDefault && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='outline' size='sm' className='text-destructive'>
                  <TrashIcon className='mr-2 h-4 w-4' />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the &quot;{workflow.name}&quot; workflow
                    and all its stages. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button variant='destructive' asChild>
                      <Link
                        href={`/dashboard/settings/workflows/${workflow.id}/delete`}
                      >
                        Delete Workflow
                      </Link>
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
