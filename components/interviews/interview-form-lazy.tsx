'use client';

import dynamic from 'next/dynamic';
import { FormSkeleton } from '@/components/ui/form-skeleton';

// Defers react-hook-form + zodResolver + the cmdk MultiSelect (the
// only consumer of cmdk in the app) + Radix Select + date-fns helpers
// + the Calendar popover.
export const InterviewForm = dynamic(
  () => import('./interview-form').then((m) => m.InterviewForm),
  { ssr: false, loading: () => <FormSkeleton rows={8} /> }
);
