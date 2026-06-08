// components/workflows/workflow-stages.tsx

'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { reorderStages } from '@/actions/workflow';
import { cn } from '@/lib/utils';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Stage, Workflow } from '@/lib/generated/prisma/browser';

interface WorkflowWithStages extends Workflow {
  stages: Stage[];
}

interface WorkflowStagesProps {
  workflow: WorkflowWithStages;
}

export function WorkflowStages({ workflow }: WorkflowStagesProps) {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>(workflow.stages);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((stage) => stage.id === active.id);
      const newIndex = stages.findIndex((stage) => stage.id === over.id);

      // Create a new array with the updated order
      const newStages = [...stages];
      const [movedStage] = newStages.splice(oldIndex, 1);
      newStages.splice(newIndex, 0, movedStage);

      // Update local state immediately for better UX
      setStages(newStages);

      // Update the order in the database
      setIsReordering(true);
      try {
        await reorderStages(
          workflow.id,
          newStages.map((stage) => stage.id)
        );
        router.refresh();
      } catch (error) {
        console.error('Failed to reorder stages:', error);
        setStages(workflow.stages); // Restore original order on error
      } finally {
        setIsReordering(false);
      }
    }
  }

  if (stages.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center space-y-2 p-8 text-center border rounded-md'>
        <h3 className='text-lg font-semibold'>No stages defined</h3>
        <p className='text-sm text-muted-foreground'>
          Add stages to define the interview process
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stages.map((stage) => stage.id)}
          strategy={verticalListSortingStrategy}
        >
          {stages.map((stage) => (
            <SortableStageCard
              key={stage.id}
              stage={stage}
              workflowId={workflow.id}
            />
          ))}
        </SortableContext>
      </DndContext>

      {isReordering && (
        <div className='text-sm text-center text-muted-foreground'>
          Saving stage order...
        </div>
      )}
    </div>
  );
}

interface SortableStageCardProps {
  stage: Stage;
  workflowId: string;
}

function SortableStageCard({ stage, workflowId }: SortableStageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-md border',
        isDragging && 'opacity-50 border-dashed'
      )}
    >
      <Card>
        <CardHeader className='p-4 flex flex-row items-center'>
          <div
            {...attributes}
            {...listeners}
            className='mr-2 cursor-grab touch-none'
          >
            <GripVertical className='h-5 w-5 text-muted-foreground' />
          </div>
          <div className='flex-1'>
            <CardTitle className='text-base'>
              Stage {stage.order + 1}: {stage.name}
            </CardTitle>
            {stage.description && (
              <CardDescription>{stage.description}</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardFooter className='p-4 pt-0 flex justify-end space-x-2'>
          <Button variant='outline' size='sm' asChild>
            <Link
              href={`/settings/workflows/${workflowId}/stages/${stage.id}/edit`}
            >
              <PencilIcon className='mr-2 h-4 w-4' />
              Edit
            </Link>
          </Button>
          <Button variant='outline' size='sm' className='text-destructive' asChild>
            <Link
              href={`/settings/workflows/${workflowId}/stages/${stage.id}/delete`}
            >
              <TrashIcon className='mr-2 h-4 w-4' />
              Delete
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
