'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormAction } from '@/hooks/use-form-action';
import { RegisterSchema } from '@/lib/validations/auth';
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
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { register } from '@/actions/auth/register';

export function RegisterForm() {
  const router = useRouter();
  // success message stays local — useFormAction owns isSubmitting + error.
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const { submit, isSubmitting: isPending, error } = useFormAction(
    async (values: z.infer<typeof RegisterSchema>) => register(values),
    {
      errorMessage: 'Something went wrong',
      onSuccess: (result) => {
        setSuccess(result.message);
        form.reset();
        setTimeout(() => router.push('/login'), 2000);
      },
    }
  );

  const onSubmit = async (values: z.infer<typeof RegisterSchema>) => {
    setSuccess(null);
    await submit(values);
  };

  return (
    <CardWrapper
      headerTitle='Create your account'
      headerLabel='Start a free 30-day trial. No credit card required.'
      backButtonLabel='Already have an account? Sign in'
      backButtonHref='/login'
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[13px] font-medium'>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='Jane Doe'
                    autoComplete='name'
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
                    placeholder='Use 8 or more characters'
                    autoComplete='new-password'
                    disabled={isPending}
                    className='h-11 bg-card'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <FormBanner variant='error'>{error}</FormBanner>}
          {success && <FormBanner variant='success'>{success}</FormBanner>}

          <Button
            type='submit'
            disabled={isPending}
            className='h-11 w-full gap-2 rounded-md text-[14px] font-medium'
          >
            {isPending ? 'Creating account…' : 'Create account'}
            {!isPending && <ArrowRight className='size-4' strokeWidth={2} />}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
