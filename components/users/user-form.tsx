// components/users/user-form.tsx

'use client';

import { useFormAction } from '@/hooks/use-form-action';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole } from '@/lib/generated/prisma/browser';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createUser, updateUser } from '@/actions/user';
import { ReloadIcon } from '@radix-ui/react-icons';

// Base schema for both new users and updates
const baseUserSchema = {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole),
};

// New user schema (requires password)
const newUserSchema = z.object({
  ...baseUserSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Update user schema (password is optional)
const updateUserSchema = z.object({
  ...baseUserSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional()
    .refine((val) => val === undefined || val.length >= 8, {
      message: 'Password must be at least 8 characters',
    }),
});

// Use the broader (password-optional) shape so the same Resolver type works
// in both create and edit modes. The required-password rule on create is
// enforced at runtime by zodResolver(newUserSchema).
type UserFormValues = z.infer<typeof updateUserSchema>;

// Only the fields the form actually reads. Accepts the password-less
// SafeUser shape from data/user.ts so admin pages don't have to send the
// bcrypt hash to the client just to prefill the form.
interface UserFormProps {
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
  } | null;
  isEdit?: boolean;
}

export function UserForm({ user, isEdit = false }: UserFormProps) {
  const router = useRouter();

  const schema = isEdit ? updateUserSchema : newUserSchema;

  const defaultValues: UserFormValues = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || UserRole.USER,
    password: '',
  };

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { submit, isSubmitting, error } = useFormAction(
    async (values: UserFormValues) => {
      if (isEdit && user) {
        // Strip empty password on edit so the action treats it as "no change".
        const { password, name, email, role } = values;
        await updateUser(user.id, {
          name,
          email,
          role,
          ...(password ? { newPassword: password } : {}),
        });
      } else {
        // newUserSchema's resolver guarantees password is set on create.
        await createUser({ ...values, password: values.password! });
      }
    },
    {
      errorMessage: 'Failed to save user.',
      onSuccess: () => {
        router.push('/dashboard/settings/users');
        router.refresh();
      },
    }
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className='space-y-6'>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='John Doe' {...field} />
              </FormControl>
              <FormDescription>The user&apos;s full name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='john@example.com'
                  {...field}
                  readOnly={isEdit} // Email cannot be changed for existing users
                  className={isEdit ? 'bg-muted' : ''}
                />
              </FormControl>
              <FormDescription>
                {isEdit
                  ? 'Email addresses cannot be changed'
                  : 'The email address used for login'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEdit ? 'New Password (Optional)' : 'Password'}
              </FormLabel>
              <FormControl>
                <Input
                  type='password'
                  placeholder='••••••••'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                {isEdit
                  ? 'Leave blank to keep the current password'
                  : 'Must be at least 8 characters'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='role'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a role' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The user&apos;s access level in the system
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex items-center justify-end space-x-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && (
              <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
            )}
            {isEdit ? 'Update user' : 'Create user'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
