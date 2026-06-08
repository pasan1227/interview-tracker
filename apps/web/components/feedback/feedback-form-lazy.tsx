'use client';

import dynamic from 'next/dynamic';
import { FormSkeleton } from '@/components/ui/form-skeleton';

// Defers react-hook-form + useFieldArray + zodResolver + StarRating +
// Radix Select. Page handles its own auth gate before mounting.
export const FeedbackForm = dynamic(
  () => import('./feedback-form').then((m) => m.FeedbackForm),
  { ssr: false, loading: () => <FormSkeleton rows={6} /> }
);
