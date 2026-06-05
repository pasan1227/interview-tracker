// Shared shape for every paginated list query in data/. Each fetcher
// (getCandidates, getInterviews, …) returns this so the table components
// they hand off to all share one prop contract.

export interface PaginatedQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
}

export function paginate(query: PaginatedQuery) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, Math.min(100, query.limit ?? 10));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  limit: number
): PaginatedResult<T> {
  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
