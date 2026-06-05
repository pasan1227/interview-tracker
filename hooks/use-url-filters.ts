'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';

interface UseUrlFiltersOptions {
  /** Param keys this filter owns. Used by `clear()` to know what to remove,
   *  and by `isActive` to know what counts as "filtered". */
  keys: readonly string[];
  /** Param keys to delete on every push/clear, e.g. `'page'` so changing a
   *  filter sends the user back to page 1. */
  resetKeys?: readonly string[];
}

interface UrlFiltersApi {
  /** Read the current URL value for `key` ('' if missing). */
  get: (key: string) => string;
  /** Push a patch to the URL. Empty / null / undefined values delete the
   *  param. resetKeys are always deleted. */
  push: (patch: Record<string, string | null | undefined>) => void;
  /** Delete every key the hook owns (plus resetKeys). */
  clear: () => void;
  /** True if any of `keys` is set in the URL. */
  isActive: boolean;
  /** Pending state of the underlying transition. */
  isPending: boolean;
}

/**
 * URL-state plumbing shared across the dashboard's filter components.
 * Each component declares which params it owns; the hook handles
 * reading, patching, clearing, and the router transition.
 */
export function useUrlFilters({
  keys,
  resetKeys = [],
}: UseUrlFiltersOptions): UrlFiltersApi {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Stable string keys for memoization without depending on array identity.
  const ownedKey = useMemo(() => keys.join(','), [keys]);
  const resetKey = useMemo(() => resetKeys.join(','), [resetKeys]);

  const get = useCallback((key: string) => params.get(key) ?? '', [params]);

  const isActive = useMemo(
    () => keys.some((k) => Boolean(params.get(k))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, ownedKey]
  );

  const navigate = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      for (const k of resetKeys) next.delete(k);
      const query = next.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, pathname, router, resetKey]
  );

  const push = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      navigate((next) => {
        for (const [k, v] of Object.entries(patch)) {
          if (v == null || v === '') next.delete(k);
          else next.set(k, v);
        }
      });
    },
    [navigate]
  );

  const clear = useCallback(() => {
    navigate((next) => {
      for (const k of keys) next.delete(k);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, ownedKey]);

  return { get, push, clear, isActive, isPending };
}
