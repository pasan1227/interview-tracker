import { cn } from '@/lib/utils';
import { Loader } from 'lucide-react';
import { FC } from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        'text-gray-500 dark:text-gray-400 h-full w-full',
        className
      )}
    >
      <Loader className='animate-spin' />
    </div>
  );
};
