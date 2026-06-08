import { NewVerificationForm } from '@/components/auth/new-verification-form';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loader';

export default function NewVerificationPage() {
  return (
    <div className='flex items-center justify-center min-h-screen w-full px-4'>
      <Suspense fallback={<LoadingSpinner />}>
        <NewVerificationForm />
      </Suspense>
    </div>
  );
}
