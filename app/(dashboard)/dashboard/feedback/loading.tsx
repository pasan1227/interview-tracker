import { LoadingSpinner } from '@/components/ui/loader';
import { FC } from 'react';

interface loadingProps {}

const Loading: FC<loadingProps> = ({}) => {
  return <LoadingSpinner className='flex items-center justify-center' />;
};

export default Loading;
