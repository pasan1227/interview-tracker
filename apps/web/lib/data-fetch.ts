// Tiny wrapper for the try/catch + log + return-fallback pattern that
// every read in data/*.ts hand-rolls. Migrating an existing reader is
// optional — they all work as-is — but new readers should reach for
// this so the failure mode is consistent.
//
// Usage:
//   export const getCandidatesBySource = (source: string) =>
//     safeFetch('candidates-by-source', () =>
//       db.candidate.findMany({ where: { source } }),
//     []);
//
// Mutation wrappers should NOT use this — they should let the error
// propagate so the calling action can surface it to the form.
export function safeFetch<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  return fn().catch((error) => {
    console.error(`Failed to fetch ${label}:`, error);
    return fallback;
  });
}
