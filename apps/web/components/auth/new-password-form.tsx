'use client';

import { newPassword } from '@/actions/auth/new-password';
import { CardWrapper } from '@/components/auth/card-wrapper';
import { FormBanner } from '@/components/ui/form-banner';
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
import { useFormAction } from '@/hooks/use-form-action';
import { NewPasswordSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: { password: '' },
  });

  const { submit, isSubmitting: isPending, error } = useFormAction(
    async (values: z.infer<typeof NewPasswordSchema>) =>
      newPassword(values, token),
    {
      errorMessage: 'Something went wrong',
      onSuccess: (result) => {
        setSuccess(result.message);
        form.reset();
      },
    }
  );

  const onSubmit = async (values: z.infer<typeof NewPasswordSchema>) => {
    setSuccess(null);
    await submit(values);
  };

  return (
    <CardWrapper
      headerTitle='Choose a new password'
      headerLabel='Pick a strong one — 8+ characters.'
      backButtonLabel='Back to sign in'
      backButtonHref='/login'
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4'
        >
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-[13px] font-medium'>
                  New password
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
            {isPending ? 'Saving…' : 'Save password'}
            {!isPending && <ArrowRight className='size-4' strokeWidth={2} />}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
