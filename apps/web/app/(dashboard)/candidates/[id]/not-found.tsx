// app/(dashboard)/candidates/[id]/not-found.tsx

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CandidateNotFound() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] space-y-4'>
      <h1 className='text-3xl font-bold'>Candidate Not Found</h1>
      <p className='text-muted-foreground text-center max-w-md'>
        The candidate you are looking for does not exist or has been deleted.
      </p>
      <Button asChild>
        <Link href='/candidates'>Back to Candidates</Link>
      </Button>
    </div>
  );
}
