// apps/api/src/middleware/scope.ts

import type { MiddlewareHandler } from 'hono';
import { hasScope, type ApiScope } from '@hiring-os/api-auth';
import type { ApiVariables } from './auth';

export function requireScope(scope: ApiScope): MiddlewareHandler<{
  Variables: ApiVariables;
}> {
  return async (c, next) => {
    const token = c.get('apiToken');
    if (!token || !hasScope(token.scopes, scope)) {
      return c.json({ error: 'Insufficient scope', required: scope }, 403);
    }
    return next();
  };
}
