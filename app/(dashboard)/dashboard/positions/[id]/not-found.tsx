import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PositionNotFound() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] space-y-4'>
      <h1 className='text-3xl font-bold'>Position Not Found</h1>
      <p className='text-muted-foreground text-center max-w-md'>
        The position you are looking for does not exist or has been deleted.
      </p>
      <Button asChild>
        <Link href='/dashboard/positions'>Back to Positions</Link>
      </Button>
    </div>
  );
}
