'use client';

import dynamic from 'next/dynamic';
import { FormSkeleton } from '@/components/ui/form-skeleton';

// Defers react-hook-form + zodResolver + Radix Select + Textarea/Input
// to first interaction. The new/edit pages live behind a route nav,
// so the form module doesn't need to be in the initial dashboard
// bundle.
export const CandidateForm = dynamic(
  () => import('./candidate-form').then((m) => m.CandidateForm),
  { ssr: false, loading: () => <FormSkeleton rows={6} /> }
);
