// components/settings/general-settings-form.tsx

'use client';

import { useState } from 'react';
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

// Form schema
const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyLogo: z.string().optional().nullable(),
  emailNotifications: z.boolean(),
  feedbackReminders: z.boolean(),
  defaultInterviewLength: z
    .number()
    .int()
    .min(15, 'Must be at least 15 minutes')
    .max(240, 'Must be at most 240 minutes'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface GeneralSettingsFormProps {
  settings: Settings;
}

export function GeneralSettingsForm({ settings }: GeneralSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  async function onSubmit(values: SettingsFormValues) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await updateSettings(values);
      setSuccess('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
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
                  value={field.value.toString()}
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
