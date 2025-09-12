import { LoginForm } from '@/components/auth/login-form';
import { LoadingSpinner } from '@/components/ui/loader';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className='h-full min-h-screen w-full mx-auto my-auto max-w-md space-y-6 flex items-center justify-center'>
      <Suspense fallback={<LoadingSpinner />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
