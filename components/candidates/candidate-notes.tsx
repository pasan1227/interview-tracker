// components/candidates/candidate-notes.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon } from 'lucide-react';
import { addCandidateNote } from '@/actions/candidate';
import { Note } from '@/lib/generated/prisma/browser';
import { ReloadIcon } from '@radix-ui/react-icons';

interface CandidateNotesProps {
  notes: Note[];
  candidateId: string;
}

export function CandidateNotes({ notes, candidateId }: CandidateNotesProps) {
  const router = useRouter();
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAddNote() {
    if (!newNote.trim()) return;

    setIsSubmitting(true);

    try {
      await addCandidateNote(candidateId, newNote);
      setNewNote('');
      router.refresh();
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div className='flex flex-col space-y-2'>
          <Textarea
            placeholder='Add a new note...'
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className='min-h-32'
            disabled={isSubmitting}
          />
          <div className='flex justify-end'>
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <PlusIcon className='mr-2 h-4 w-4' />
              )}
              Add Note
            </Button>
          </div>
        </div>
      </div>

      {notes.length > 0 ? (
        <div className='space-y-4'>
          {notes.map((note) => (
            <div key={note.id} className='rounded-md border p-4'>
              <div className='flex justify-between items-center mb-2'>
                <p className='text-sm text-muted-foreground'>
                  {formatDate(note.createdAt)}
                </p>
              </div>
              <p className='whitespace-pre-line text-sm'>{note.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center space-y-2 py-4 text-center'>
          <h3 className='text-lg font-semibold'>No notes yet</h3>
          <p className='text-sm text-muted-foreground'>
            Add notes to keep track of important information about this
            candidate
          </p>
        </div>
      )}
    </div>
  );
}
