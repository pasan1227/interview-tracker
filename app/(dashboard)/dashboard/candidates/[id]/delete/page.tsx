// app/(dashboard)/dashboard/candidates/[id]/delete/page.tsx

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getCandidateById } from '@/data/candidate';
import { Button } from '@/components/ui/button';
import { CandidateDeleteForm } from '@/components/candidates/candidate-delete-form';
import { UserRole } from '@/lib/generated/prisma/browser';

// Define the props type according to Next.js 15 standards
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeleteCandidatePage({ params }: PageProps) {
  const session = await auth();

  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }
  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    redirect('/dashboard');
  }

  const candidate = await getCandidateById(id);

  if (!candidate) {
    notFound();
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Delete Candidate</h1>
        <p className='text-muted-foreground'>
          Are you sure you want to delete this candidate?
        </p>
      </div>

      <div className='rounded-md border p-6 bg-white'>
        <div className='space-y-4'>
          <div>
            <h2 className='text-xl font-bold text-red-600'>Warning</h2>
            <p className='text-muted-foreground'>
              This action cannot be undone. This will permanently delete the
              candidate
              <span className='font-semibold'> {candidate.name} </span>
              and all associated data including interviews, feedback, and notes.
            </p>
          </div>

          <div className='border rounded-md p-4 bg-slate-50'>
            <h3 className='font-semibold'>Candidate Information</h3>
            <div className='mt-2 space-y-1 text-sm'>
              <p>
                <span className='text-muted-foreground'>Name:</span>{' '}
                {candidate.name}
              </p>
              <p>
                <span className='text-muted-foreground'>Email:</span>{' '}
                {candidate.email}
              </p>
              <p>
                <span className='text-muted-foreground'>Position:</span>{' '}
                {candidate.position?.title || 'No position'}
              </p>
              <p>
                <span className='text-muted-foreground'>Status:</span>{' '}
                {candidate.status.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <CandidateDeleteForm candidateId={candidate.id} />

          <div className='flex justify-end'>
            <Button variant='outline' asChild>
              <Link href={`/dashboard/candidates/${candidate.id}`}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
