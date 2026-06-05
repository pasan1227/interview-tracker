'use client';

import { useEffect, useState } from 'react';

export interface Stage {
  id: string;
  name: string;
  order: number;
}

/**
 * Fetch the workflow stages for the given position. Returns an empty list
 * while loading or when no position is selected. Aborts in-flight requests
 * if the position changes before the previous response lands.
 */
export function useStagesForPosition(positionId: string | undefined) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!positionId) {
      setStages([]);
      return;
    }
    const ac = new AbortController();
    setIsLoading(true);
    fetch(`/api/positions/${positionId}/stages`, { signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Stage[]>) : []))
      .then((data) => setStages(data))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch stages:', err);
        }
      })
      .finally(() => setIsLoading(false));
    return () => ac.abort();
  }, [positionId]);

  return { stages, isLoading };
}
