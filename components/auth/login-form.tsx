'use client';

import { login } from '@/actions/auth/login';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { FormBanner } from '@/components/auth/form-banner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoginSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setIsPending(true);
    setError(null);
    setInfo(null);

    try {
      const result = await login(values, callbackUrl);
      if (result?.error) setError(result.error);
      else if (result?.verifyEmail) setInfo(result.verifyEmail);
      else if (result?.twoFactor) setTwoFactor(true);
      setIsPending(false);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'digest' in error &&
        String(error.digest).includes('NEXT_REDIRECT')
      ) {
        return;
      }
      console.error('Login error:', error);
      setError('Something went wrong');
      setIsPending(false);
    }
  }

  return (
    <CardWrapper
      headerTitle='Sign in'
      headerLabel='Welcome back. Enter your credentials to access your workspace.'
      backButtonLabel="Don't have an account? Create one"
      backButtonHref='/register'
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4'
        >
          {!twoFactor && (
            <>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[13px] font-medium'>
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type='email'
                        placeholder='name@company.com'
                        autoComplete='email'
                        disabled={isPending}
                        className='h-11 bg-card'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-baseline justify-between'>
                      <FormLabel className='text-[13px] font-medium'>
                        Password
                      </FormLabel>
                      <Link
                        href='/reset'
                        className='text-[12px] text-muted-foreground hover:text-foreground'
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        type='password'
                        placeholder='••••••••'
                        autoComplete='current-password'
                        disabled={isPending}
                        className='h-11 bg-card'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {twoFactor && (
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[13px] font-medium'>
                    Two-factor code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode='numeric'
                      autoComplete='one-time-code'
                      placeholder='123456'
                      disabled={isPending}
                      className='h-11 bg-card tracking-[0.4em]'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {error && <FormBanner variant='error'>{error}</FormBanner>}
          {info && <FormBanner variant='info'>{info}</FormBanner>}

          <Button
            type='submit'
            disabled={isPending}
            className='h-11 w-full gap-2 rounded-md text-[14px] font-medium'
          >
            {isPending
              ? 'Signing in…'
              : twoFactor
                ? 'Verify code'
                : 'Sign in'}
            {!isPending && <ArrowRight className='size-4' strokeWidth={2} />}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
