'use client';

import { newVerification } from '@/actions/auth/new-verification';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, Suspense } from 'react';
import { BeatLoader } from 'react-spinners';
import Link from 'next/link';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This component will handle the actual verification logic
function VerificationContent() {
  const searchparams = useSearchParams();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const token = searchparams.get('token');

  const onSubmit = useCallback(() => {
    // Prevent multiple submissions
    if (success || error || !isLoading) return;
    
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
      .catch(() => {
        setError('Something went wrong!');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, success, error, isLoading]);

  useEffect(() => {
    // Only run once when component mounts
    let mounted = true;
    
    const verify = async () => {
      if (!mounted || success || error) return;
      onSubmit();
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [onSubmit, success, error]); // Include dependencies

  return (
    <div className='flex flex-col items-center space-y-6 text-center'>
      {isLoading && (
        <div className='flex flex-col items-center space-y-4'>
          <BeatLoader size={12} color='#3b82f6' />
          <p className='text-sm text-muted-foreground animate-pulse'>
            Verifying your email address...
          </p>
        </div>
      )}

      {success && (
        <div className='flex flex-col items-center space-y-4'>
          <div className='rounded-full bg-green-100 p-3'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
          <div className='space-y-2'>
            <h2 className='text-lg font-semibold text-green-800'>Email Verified!</h2>
            <p className='text-sm text-green-600'>{success}</p>
          </div>
          <Button asChild className='mt-4'>
            <Link href='/login'>
              Continue to Login
            </Link>
          </Button>
        </div>
      )}

      {error && (
        <div className='flex flex-col items-center space-y-4'>
          <div className='rounded-full bg-red-100 p-3'>
            <AlertCircle className='h-6 w-6 text-red-600' />
          </div>
          <div className='space-y-2'>
            <h2 className='text-lg font-semibold text-red-800'>Verification Failed</h2>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
          <div className='flex space-x-2'>
            <Button variant='outline' asChild>
              <Link href='/register'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Register
              </Link>
            </Button>
            <Button asChild>
              <Link href='/login'>
                Try Login
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// This is a fallback loading state while the Suspense is resolving
function VerificationLoading() {
  return (
    <div className='flex flex-col items-center space-y-4'>
      <BeatLoader size={12} color='#3b82f6' />
      <p className='text-sm text-muted-foreground animate-pulse'>
        Loading verification...
      </p>
    </div>
  );
}

// Main component with updated UI to match the rest of the app
export const NewVerificationForm = () => {
  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-6'>
        <div className='space-y-6'>
          <div className='space-y-2 text-center'>
            <h1 className='text-2xl font-semibold tracking-tight'>Email Verification</h1>
            <p className='text-sm text-muted-foreground'>
              We're confirming your email address
            </p>
          </div>
          
          <Suspense fallback={<VerificationLoading />}>
            <VerificationContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default NewVerificationForm;
