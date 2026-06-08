// apps/api/src/pagination.ts
//
// Cursor pagination helper used by every list endpoint. We use cursor
// (createdAt + id) rather than offset because offset gets quadratic at
// scale and a tenant with 100k candidates can browse far past the
// cheap pages.
//
// Wire format:
//   ?limit=50&cursor=<base64({createdAt,id})>
// Response:
//   { data: [...], nextCursor: string | null }

export type PageOpts = {
  limit: number;
  cursor: { createdAt: Date; id: string } | null;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function parsePage(query: URLSearchParams): PageOpts {
  const limitRaw = Number(query.get('limit') ?? DEFAULT_LIMIT);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(MAX_LIMIT, Math.floor(limitRaw))
      : DEFAULT_LIMIT;
  const cursorRaw = query.get('cursor');
  let cursor: PageOpts['cursor'] = null;
  if (cursorRaw) {
    try {
      const decoded = JSON.parse(
        Buffer.from(cursorRaw, 'base64url').toString('utf8')
      ) as { createdAt: string; id: string };
      cursor = { createdAt: new Date(decoded.createdAt), id: decoded.id };
    } catch {
      // Bad cursor → treat as first page. Safer than 400 because the
      // most common cause is hand-edited URLs in browser address bar.
    }
  }
  return { limit, cursor };
}

export function encodeCursor(row: {
  createdAt: Date;
  id: string;
}): string {
  return Buffer.from(
    JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id })
  ).toString('base64url');
}
