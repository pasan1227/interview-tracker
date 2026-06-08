import { NewPasswordForm } from '@/components/auth/new-password-form';
import { LoadingSpinner } from '@/components/ui/loader';
import { Suspense } from 'react';

export default function NewPasswordPage() {
  return (
    <div className='w-full max-w-[420px]'>
      <Suspense fallback={<LoadingSpinner />}>
        <NewPasswordForm />
      </Suspense>
    </div>
  );
}
