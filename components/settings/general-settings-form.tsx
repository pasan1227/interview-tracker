// components/settings/general-settings-form.tsx

'use client';

import { useState } from 'react';
import { useFormAction } from '@/hooks/use-form-action';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UpdateSettingsSchema,
  type UpdateSettingsInput,
} from '@/lib/validations/dashboard';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateSettings } from '@/actions/settings';
import { Settings } from '@/lib/generated/prisma/browser';
import { ReloadIcon } from '@radix-ui/react-icons';

type SettingsFormValues = UpdateSettingsInput;

interface GeneralSettingsFormProps {
  settings: Settings;
}

export function GeneralSettingsForm({ settings }: GeneralSettingsFormProps) {
  // useFormAction owns isSubmitting + error. success stays local because
  // the hook doesn't manage banners.
  const [success, setSuccess] = useState<string | null>(null);

  // Default values for the form
  const defaultValues: Partial<SettingsFormValues> = {
    companyName: settings.companyName || '',
    companyLogo: settings.companyLogo || '',
    emailNotifications: settings.emailNotifications ?? true,
    feedbackReminders: settings.feedbackReminders ?? true,
    defaultInterviewLength: settings.defaultInterviewLength ?? 60,
  };

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(UpdateSettingsSchema),
    defaultValues,
  });

  const { submit, isSubmitting, error } = useFormAction(
    async (values: SettingsFormValues) => {
      await updateSettings(values);
    },
    {
      errorMessage: 'Failed to update settings. Please try again.',
      onSuccess: () => setSuccess('Settings updated successfully'),
    }
  );

  const submitWithReset = async (values: SettingsFormValues) => {
    setSuccess(null);
    await submit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitWithReset)} className='space-y-6'>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className='bg-green-50 text-green-600 border-green-200'>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name='companyName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder='Your Company Name' {...field} />
              </FormControl>
              <FormDescription>
                This name will appear in email notifications and the application
                title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='companyLogo'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Logo URL</FormLabel>
              <FormControl>
                <Input
                  placeholder='https://example.com/logo.png'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                URL to your company logo (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='space-y-4 border-t pt-4'>
          <h2 className='font-medium'>Notification Settings</h2>

          <FormField
            control={form.control}
            name='emailNotifications'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    Email Notifications
                  </FormLabel>
                  <FormDescription>
                    Send email notifications for interview scheduling
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='feedbackReminders'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>
                    Feedback Reminders
                  </FormLabel>
                  <FormDescription>
                    Send reminder emails for pending interview feedback
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className='space-y-4 border-t pt-4'>
          <h2 className='font-medium'>Interview Settings</h2>

          <FormField
            control={form.control}
            name='defaultInterviewLength'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Interview Length (minutes)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={String(field.value ?? '')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select interview length' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='15'>15 minutes</SelectItem>
                    <SelectItem value='30'>30 minutes</SelectItem>
                    <SelectItem value='45'>45 minutes</SelectItem>
                    <SelectItem value='60'>60 minutes</SelectItem>
                    <SelectItem value='90'>90 minutes</SelectItem>
                    <SelectItem value='120'>120 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Default duration when creating new interviews
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex items-center justify-end space-x-4 pt-4'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && (
              <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
            )}
            Save Settings
          </Button>
        </div>
      </form>
    </Form>
  );
}
