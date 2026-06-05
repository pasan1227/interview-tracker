'use client';

import { login } from '@/actions/auth/login';
import { CardWrapper } from '@/components/auth/card-wrapper';
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
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof LoginSchema>) {
    setIsPending(true);
    setError(null);

    try {
      const result = await login(values, callbackUrl);

      if (result?.error) {
        setError(result.error);
        setIsPending(false);
      } else if (result?.success) {
        router.push(DEFAULT_LOGIN_REDIRECT);
        setIsPending(false);
      }
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
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[13px] font-medium'>Email</FormLabel>
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
                <FormLabel className='text-[13px] font-medium'>
                  Password
                </FormLabel>
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

          {error && (
            <div
              className='rounded-md border px-3 py-2 text-[13px]'
              style={{
                borderColor: 'color-mix(in oklch, var(--destructive) 30%, transparent)',
                backgroundColor:
                  'color-mix(in oklch, var(--destructive) 8%, transparent)',
                color: 'var(--destructive)',
              }}
            >
              {error}
            </div>
          )}

          <Button
            type='submit'
            disabled={isPending}
            className='h-11 w-full gap-2 rounded-md text-[14px] font-medium'
          >
            {isPending ? 'Signing in…' : 'Sign in'}
            {!isPending && <ArrowRight className='size-4' strokeWidth={2} />}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
