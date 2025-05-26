import { FC } from 'react';
import { BeatLoader } from 'react-spinners';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ className }) => {
  return (
    <div className='flex justify-center items-center h-full min-h-[400px]'>
      <BeatLoader />
    </div>
  );
};
