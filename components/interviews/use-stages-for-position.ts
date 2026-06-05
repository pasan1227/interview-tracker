'use client';

import { getStagesForPosition } from '@/actions/position';
import { useEffect, useState } from 'react';

export interface Stage {
  id: string;
  name: string;
  order: number;
}

/**
 * Fetch the workflow stages for the given position via the server action.
 * Returns an empty list while loading or when no position is selected.
 *
 * If the position changes mid-fetch, the second response wins via a
 * monotonically-increasing request ID — server actions don't accept
 * AbortSignal, so we can't cancel the in-flight call, just discard it.
 */
export function useStagesForPosition(positionId: string | undefined) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!positionId) {
      setStages([]);
      return;
    }
    let canceled = false;
    setIsLoading(true);
    getStagesForPosition(positionId)
      .then((data) => {
        if (canceled) return;
        setStages(data);
      })
      .catch((err) => {
        if (canceled) return;
        console.error('Failed to fetch stages:', err);
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [positionId]);

  return { stages, isLoading };
}
