import { ReloadIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex justify-center items-center h-full min-h-100',
        className
      )}
    >
      <ReloadIcon
        className='h-8 w-8 animate-spin text-muted-foreground'
        aria-label='Loading'
      />
    </div>
  );
}
