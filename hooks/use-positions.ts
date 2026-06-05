// hooks/use-positions.ts

'use client';

import { Position } from '@/lib/generated/prisma/browser';
import { useEffect, useState } from 'react';

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPositions() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/positions');

        if (!response.ok) {
          throw new Error('Failed to fetch positions');
        }

        const data = await response.json();
        setPositions(data);
      } catch (error) {
        setError(error as Error);
        console.error('Error fetching positions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPositions();
  }, []);

  return { positions, isLoading, error };
}
