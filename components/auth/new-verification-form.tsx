'use client';

import { newVerification } from '@/actions/auth/new-verification';
import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function NewVerificationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setError('Missing token!');
      setIsLoading(false);
      return;
    }

    newVerification(token)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => setError('Something went wrong!'))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='bg-card rounded-lg border border-border shadow-sm p-6'>
        <div className='space-y-6'>
          <div className='space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Email Verification
            </h1>
            <p className='text-sm text-muted-foreground'>
              We&apos;re confirming your email address
            </p>
          </div>

          <div className='flex flex-col items-center space-y-6 text-center'>
            {isLoading && (
              <div className='flex flex-col items-center space-y-4'>
                <ReloadIcon
                  className='h-6 w-6 animate-spin text-muted-foreground'
                  aria-label='Loading'
                />
                <p className='text-sm text-muted-foreground animate-pulse'>
                  Verifying your email address...
                </p>
              </div>
            )}

            {!isLoading && success && (
              <div className='flex flex-col items-center space-y-4'>
                <div
                  className='rounded-full p-3'
                  style={{
                    backgroundColor: 'var(--badge-success-bg)',
                    color: 'var(--badge-success-fg)',
                  }}
                >
                  <CheckCircle className='h-6 w-6' />
                </div>
                <div className='space-y-2'>
                  <h2
                    className='text-lg font-semibold'
                    style={{ color: 'var(--forest)' }}
                  >
                    Email Verified!
                  </h2>
                  <p
                    className='text-sm'
                    style={{ color: 'var(--forest)' }}
                  >
                    {success}
                  </p>
                </div>
                <Button asChild className='mt-4'>
                  <Link href='/login'>Continue to Login</Link>
                </Button>
              </div>
            )}

            {!isLoading && error && (
              <div className='flex flex-col items-center space-y-4'>
                <div
                  className='rounded-full p-3'
                  style={{
                    backgroundColor: 'var(--badge-danger-bg)',
                    color: 'var(--badge-danger-fg)',
                  }}
                >
                  <AlertCircle className='h-6 w-6' />
                </div>
                <div className='space-y-2'>
                  <h2 className='text-lg font-semibold text-destructive'>
                    Verification Failed
                  </h2>
                  <p className='text-sm text-destructive'>{error}</p>
                </div>
                <div className='flex space-x-2'>
                  <Button variant='outline' asChild>
                    <Link href='/register'>
                      <ArrowLeft className='h-4 w-4 mr-2' />
                      Back to Register
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href='/login'>Try Login</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewVerificationForm;
