'use client';

import { useCallback, useState } from 'react';

interface UseFormActionOptions<R> {
  onSuccess?: (result: R) => void | Promise<void>;
  errorMessage?: string;
}

interface UseFormActionResult<V> {
  submit: (values: V) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
}

// Consolidates the `useState<isSubmitting> + useState<error> + try/catch
// + setError` boilerplate that lived in every form component. Callers
// pass the server action plus a success handler (usually router.push +
// router.refresh) and get back a `submit` ready for
// `form.handleSubmit(submit)`.
//
// Error messages: prefer Error.message if the server threw one (which
// is what AuthzError + the explicit `throw new Error(...)` calls in
// the user/candidate/interview actions produce), otherwise fall back to
// the per-form `errorMessage` opt or a generic string.
export function useFormAction<V, R>(
  action: (values: V) => Promise<R>,
  opts: UseFormActionOptions<R> = {}
): UseFormActionResult<V> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (values: V) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await action(values);
        await opts.onSuccess?.(result);
      } catch (err) {
        console.error('Form submission failed:', err);
        const message =
          err instanceof Error && err.message
            ? err.message
            : opts.errorMessage ?? 'Something went wrong. Please try again.';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [action, opts]
  );

  return { submit, isSubmitting, error, setError };
}
