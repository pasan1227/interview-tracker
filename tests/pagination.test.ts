import { describe, it, expect } from 'vitest';
import { paginate, buildPaginatedResult } from '@/lib/pagination';

describe('paginate', () => {
  it('uses sensible defaults', () => {
    expect(paginate({})).toEqual({ page: 1, limit: 10, skip: 0, take: 10 });
  });

  it('computes skip for the requested page', () => {
    expect(paginate({ page: 3, limit: 20 })).toEqual({
      page: 3,
      limit: 20,
      skip: 40,
      take: 20,
    });
  });

  it('clamps page to a minimum of 1', () => {
    expect(paginate({ page: 0 }).page).toBe(1);
    expect(paginate({ page: -5 }).page).toBe(1);
  });

  it('clamps limit to [1, 100]', () => {
    expect(paginate({ limit: 0 }).limit).toBe(1);
    expect(paginate({ limit: 1000 }).limit).toBe(100);
  });
});

describe('buildPaginatedResult', () => {
  it('computes totalPages from total / limit', () => {
    const result = buildPaginatedResult(['a', 'b'], 23, 10);
    expect(result).toEqual({ items: ['a', 'b'], total: 23, totalPages: 3 });
  });

  it('returns at least one page even with zero items', () => {
    expect(buildPaginatedResult([], 0, 10).totalPages).toBe(1);
  });

  it('preserves the input items array reference', () => {
    const items = [{ id: '1' }];
    expect(buildPaginatedResult(items, 1, 10).items).toBe(items);
  });
});
