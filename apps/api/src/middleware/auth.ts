// apps/api/src/middleware/auth.ts
//
// Bearer-token middleware. Verifies the PAT, attaches the verified
// org context to c.var, and updates the token's lastUsedAt.
//
// 401s are intentionally generic ("Unauthorized") — never reveal
// whether a token is invalid vs revoked vs expired vs unknown.
// Customers debug via the dashboard token-list page.

import type { MiddlewareHandler } from 'hono';
import {
  touchTokenLastUsed,
  verifyToken,
  type VerifiedToken,
} from '@hiring-os/api-auth';
import type { OrgContext } from '@hiring-os/db';
import type { Enums } from '@hiring-os/db';

export type ApiVariables = {
  apiToken: VerifiedToken;
  orgCtx: OrgContext;
};

export const requireToken: MiddlewareHandler<{ Variables: ApiVariables }> =
  async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    if (!header.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const raw = header.slice('Bearer '.length).trim();
    const verified = await verifyToken(raw);
    if (!verified) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    c.set('apiToken', verified);
    // API tokens act on behalf of the org, with no user actor. The
    // OrgContext.userId field is required by tenantDb but isn't a
    // real user — surface it as the literal token id so audits link
    // back to the token.
    c.set('orgCtx', {
      organizationId: verified.organizationId,
      userId: verified.tokenId,
      role: 'ADMIN' as Enums.OrganizationRole, // PAT is org-level
    });

    // Fire-and-forget last-used update.
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    void touchTokenLastUsed(verified.tokenId, ip);

    return next();
  };
