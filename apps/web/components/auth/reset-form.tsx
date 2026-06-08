'use client';

import { reset } from '@/actions/auth/reset';
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
import { ResetSchema } from '@/lib/validations/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export function ResetForm() {
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { email: '' },
  });

  const { submit, isSubmitting: isPending, error } = useFormAction(
    async (values: z.infer<typeof ResetSchema>) => reset(values),
    {
      errorMessage: 'Something went wrong',
      onSuccess: (result) => {
        setSuccess(result.message);
        form.reset();
      },
    }
  );

  const onSubmit = async (values: z.infer<typeof ResetSchema>) => {
    setSuccess(null);
    await submit(values);
  };

  return (
    <CardWrapper
      headerTitle='Reset your password'
      headerLabel="Enter your email and we'll send you a reset link."
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

          {error && <FormBanner variant='error'>{error}</FormBanner>}
          {success && <FormBanner variant='success'>{success}</FormBanner>}

          <Button
            type='submit'
            disabled={isPending}
            className='h-11 w-full gap-2 rounded-md text-[14px] font-medium'
          >
            {isPending ? 'Sending…' : 'Send reset link'}
            {!isPending && <ArrowRight className='size-4' strokeWidth={2} />}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
}
