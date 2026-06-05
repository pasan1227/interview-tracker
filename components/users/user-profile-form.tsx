// components/users/user-profile-form.tsx

'use client';

import { useState } from 'react';
import { useFormAction } from '@/hooks/use-form-action';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormBanner } from '@/components/ui/form-banner';
import { updateUser } from '@/actions/user';
import { ReloadIcon } from '@radix-ui/react-icons';

// Mirrors lib/validations/auth.ts SelfUpdateProfileSchema. We re-declare it
// here (instead of importing) because that file pulls in Prisma client types
// that don't belong in the browser bundle. confirmPassword is purely a
// client-side check.
const profileSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72)
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((d) => !d.newPassword || d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: 'Current password is required to set a new one',
    path: ['currentPassword'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileFormProps {
  user: { id: string; name: string | null };
}

export function UserProfileForm({ user }: Readonly<UserProfileFormProps>) {
  const router = useRouter();
  // useFormAction owns isSubmitting + error. success is form-specific
  // (the hook doesn't manage success messages) so it stays local.
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { submit, isSubmitting, error } = useFormAction(
    async (values: ProfileFormValues) => {
      await updateUser(user.id, {
        name: values.name,
        ...(values.newPassword
          ? {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            }
          : {}),
      });
      return values;
    },
    {
      errorMessage: 'Failed to update profile.',
      onSuccess: (values) => {
        form.reset({
          name: values.name,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setSuccess('Profile updated successfully');
        router.refresh();
      },
    }
  );

  // Clear any stale success banner when a new submit kicks off.
  const submitWithReset = async (values: ProfileFormValues) => {
    setSuccess(null);
    await submit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitWithReset)} className='space-y-6'>
        {error && <FormBanner variant='error'>{error}</FormBanner>}
        {success && <FormBanner variant='success'>{success}</FormBanner>}

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Your name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='space-y-4 border-t pt-4'>
          <h2 className='font-medium'>Change password</h2>
          <p className='text-[13px] text-muted-foreground'>
            Leave the new-password fields blank to keep your current one.
          </p>

          <FormField
            control={form.control}
            name='currentPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='••••••••'
                    autoComplete='current-password'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>
                  Required only when setting a new password.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='newPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='••••••••'
                    autoComplete='new-password'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='••••••••'
                    autoComplete='new-password'
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex items-center justify-end space-x-4'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && (
              <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
            )}
            Update profile
          </Button>
        </div>
      </form>
    </Form>
  );
}
