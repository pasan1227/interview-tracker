/**
 * Public routes — no authentication required.
 */
export const publicRoutes = ['/', '/about', '/pricing'];

/**
 * Auth routes — logged-in users are redirected away from these.
 */
export const authRoutes = [
  '/login',
  '/register',
  '/reset',
  '/new-password',
  '/new-verification',
];

/**
 * Prefix for NextAuth's API routes — never intercepted by middleware.
 */
export const apiAuthPrefix = '/api/auth';

/**
 * Default landing path after a successful login.
 */
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';

/**
 * Centralised dashboard route map. Use these instead of raw
 * `/dashboard/...` strings in Link href, redirect(), and revalidatePath
 * calls so a future segment rename (e.g. round-5 C2's
 * [positionId]→[id]) is one edit, not a grep-and-pray sweep.
 *
 * Convention:
 *   - `.list`  is the index route
 *   - `.new`   is /resource/new
 *   - `.detail(id)` / `.edit(id)` / `.delete(id)` build per-row paths
 */
export const DASHBOARD_ROUTES = {
  root: '/dashboard',
  profile: '/dashboard/profile',
  feedback: '/dashboard/feedback',
  reports: '/dashboard/reports',
  candidates: {
    list: '/dashboard/candidates',
    new: '/dashboard/candidates/new',
    detail: (id: string) => `/dashboard/candidates/${id}`,
    edit: (id: string) => `/dashboard/candidates/${id}/edit`,
    delete: (id: string) => `/dashboard/candidates/${id}/delete`,
  },
  interviews: {
    list: '/dashboard/interviews',
    new: '/dashboard/interviews/new',
    detail: (id: string) => `/dashboard/interviews/${id}`,
    edit: (id: string) => `/dashboard/interviews/${id}/edit`,
    delete: (id: string) => `/dashboard/interviews/${id}/delete`,
    feedback: {
      new: (id: string) => `/dashboard/interviews/${id}/feedback/new`,
    },
  },
  positions: {
    list: '/dashboard/positions',
    new: '/dashboard/positions/new',
    detail: (id: string) => `/dashboard/positions/${id}`,
    edit: (id: string) => `/dashboard/positions/${id}/edit`,
    delete: (id: string) => `/dashboard/positions/${id}/delete`,
  },
  settings: {
    root: '/dashboard/settings',
    general: '/dashboard/settings/general',
    users: {
      list: '/dashboard/settings/users',
      new: '/dashboard/settings/users/new',
      edit: (id: string) => `/dashboard/settings/users/${id}/edit`,
      delete: (id: string) => `/dashboard/settings/users/${id}/delete`,
    },
    workflows: {
      list: '/dashboard/settings/workflows',
      new: '/dashboard/settings/workflows/new',
      detail: (id: string) => `/dashboard/settings/workflows/${id}`,
      edit: (id: string) => `/dashboard/settings/workflows/${id}/edit`,
      delete: (id: string) => `/dashboard/settings/workflows/${id}/delete`,
      stages: {
        new: (workflowId: string) =>
          `/dashboard/settings/workflows/${workflowId}/stages/new`,
        edit: (workflowId: string, stageId: string) =>
          `/dashboard/settings/workflows/${workflowId}/stages/${stageId}/edit`,
        delete: (workflowId: string, stageId: string) =>
          `/dashboard/settings/workflows/${workflowId}/stages/${stageId}/delete`,
      },
    },
  },
} as const;

/**
 * Coerce a user-supplied `callbackUrl` to a same-app path or fall back to
 * the default landing. Blocks open-redirect via:
 *   - protocol-relative URLs (`//evil.com/...`)
 *   - absolute URLs (`https://evil.com/...`)
 *   - any non-path value
 * Accepted shape: starts with a single `/`.
 */
export function safeCallbackUrl(value: string | null | undefined): string {
  if (typeof value !== 'string' || value.length === 0) {
    return DEFAULT_LOGIN_REDIRECT;
  }
  if (!value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_LOGIN_REDIRECT;
  }
  return value;
}
