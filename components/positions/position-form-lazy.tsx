'use client';

import dynamic from 'next/dynamic';
import { FormSkeleton } from '@/components/ui/form-skeleton';

export const PositionForm = dynamic(
  () => import('./position-form').then((m) => m.PositionForm),
  { ssr: false, loading: () => <FormSkeleton rows={4} /> }
);
