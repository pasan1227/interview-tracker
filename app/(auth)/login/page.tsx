import { LoginForm } from '@/components/auth/login-form';
import { LoadingSpinner } from '@/components/ui/loader';
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className='w-full max-w-[420px]'>
      <Suspense fallback={<LoadingSpinner />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
