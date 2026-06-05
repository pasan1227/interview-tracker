'use client';

import dynamic from 'next/dynamic';
import { FormSkeleton } from '@/components/ui/form-skeleton';

export const UserForm = dynamic(
  () => import('./user-form').then((m) => m.UserForm),
  { ssr: false, loading: () => <FormSkeleton rows={4} /> }
);
