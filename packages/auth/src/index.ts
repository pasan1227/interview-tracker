// packages/auth/src/index.ts
//
// Phase 1 placeholder. The NextAuth session helpers still live in
// apps/web/lib/authz.ts because the session itself is Next-specific.
//
// In Phase 2 this package will own the permission matrix (Role +
// permissions[]) and a runtime `can()` / `requirePermission()` shared
// across apps/web, apps/api, and apps/workers. The placeholder type
// below ensures other packages can import without a Next dependency.

import type { Enums } from '@hiring-os/db';

export type Permission = string; // 'application:read', 'offer:approve', etc.

export type AuthzCtx = {
  organizationId: string;
  userId: string;
  role: Enums.OrganizationRole;
};
