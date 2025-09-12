'use client';

import { login } from '@/actions/auth/login';
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
import Link from 'next/link';
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
        // Handle successful login
        router.push(DEFAULT_LOGIN_REDIRECT);
        setIsPending(false);
      }
      // If no result returned, NextAuth is handling the redirect
    } catch (error) {
      // Check if this is a NextAuth redirect (which is expected)
      if (error && typeof error === 'object' && 'digest' in error && String(error.digest).includes('NEXT_REDIRECT')) {
        // This is expected - NextAuth is redirecting, don't show error
        return;
      }
      console.error('Login error:', error);
      setError('Something went wrong');
      setIsPending(false);
    }
  }

  return (
    <div className='w-full h-full mx-auto my-auto max-w-md space-y-6'>
      <div className='space-y-2 text-center'>
        <h1 className='text-3xl font-bold'>Login</h1>
        <p className='text-gray-500'>
          Enter your credentials to access your account
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='email'
                    placeholder='name@example.com'
                    disabled={isPending}
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='password'
                    placeholder='••••••••'
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && (
            <div className='p-3 rounded-md bg-red-50 text-red-500 text-sm'>
              {error}
            </div>
          )}
          <Button type='submit' className='w-full' disabled={isPending}>
            {isPending ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>

      <div className='text-center text-sm'>
        <p className='text-gray-500'>
          Don&apos;t have an account?{' '}
          <Link href='/register' className='text-primary font-medium'>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
