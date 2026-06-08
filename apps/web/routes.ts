/**
 * Public routes — no authentication required.
 *
 * Marketing lives at apps/marketing on its own host, so '/' on the
 * dashboard host is NOT public — it's the authenticated dashboard
 * home. /about and /pricing only existed as marketing satellites
 * served from this app pre-split; they now live on the marketing
 * host. Leave the array empty until we deliberately add a public
 * route to the dashboard host (e.g. /health, /careers).
 */
export const publicRoutes: string[] = [];

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
 * Onboarding routes — accessible to logged-in users *without* an
 * active organization. Middleware lets these through even when
 * activeOrgId is null. Includes the no-access page for users that
 * have zero memberships (invite-only signup means they can't bootstrap
 * an org themselves).
 */
export const orgOnboardingRoutes = ['/select-org', '/no-access'];

/**
 * Public-but-auth-required routes that work without an active org.
 * Used by middleware so a user without an active org can still accept
 * an invitation (which sets one).
 */
export const noOrgRequiredRoutes = ['/invitations/accept'];

/**
 * Prefix for NextAuth's API routes — never intercepted by middleware.
 */
export const apiAuthPrefix = '/api/auth';

/**
 * Default landing path after a successful login.
 *
 * Pre-marketing-split this was '/dashboard'. Now that the dashboard
 * IS the entire app at this host, the home is just '/'.
 */
export const DEFAULT_LOGIN_REDIRECT = '/';

/**
 * Centralised dashboard route map. Use these instead of raw string
 * URLs in Link href, redirect(), and revalidatePath calls so a future
 * segment rename is one edit, not a grep-and-pray sweep.
 *
 * Convention:
 *   - `.list`  is the index route
 *   - `.new`   is /resource/new
 *   - `.detail(id)` / `.edit(id)` / `.delete(id)` build per-row paths
 */
export const DASHBOARD_ROUTES = {
  root: '/',
  profile: '/profile',
  feedback: '/feedback',
  reports: '/reports',
  candidates: {
    list: '/candidates',
    new: '/candidates/new',
    detail: (id: string) => `/candidates/${id}`,
    edit: (id: string) => `/candidates/${id}/edit`,
    delete: (id: string) => `/candidates/${id}/delete`,
  },
  interviews: {
    list: '/interviews',
    new: '/interviews/new',
    detail: (id: string) => `/interviews/${id}`,
    edit: (id: string) => `/interviews/${id}/edit`,
    delete: (id: string) => `/interviews/${id}/delete`,
    feedback: {
      new: (id: string) => `/interviews/${id}/feedback/new`,
    },
  },
  positions: {
    list: '/positions',
    new: '/positions/new',
    detail: (id: string) => `/positions/${id}`,
    edit: (id: string) => `/positions/${id}/edit`,
    delete: (id: string) => `/positions/${id}/delete`,
  },
  settings: {
    root: '/settings',
    general: '/settings/general',
    users: {
      list: '/settings/users',
      new: '/settings/users/new',
      edit: (id: string) => `/settings/users/${id}/edit`,
      delete: (id: string) => `/settings/users/${id}/delete`,
    },
    workflows: {
      list: '/settings/workflows',
      new: '/settings/workflows/new',
      detail: (id: string) => `/settings/workflows/${id}`,
      edit: (id: string) => `/settings/workflows/${id}/edit`,
      delete: (id: string) => `/settings/workflows/${id}/delete`,
      stages: {
        new: (workflowId: string) =>
          `/settings/workflows/${workflowId}/stages/new`,
        edit: (workflowId: string, stageId: string) =>
          `/settings/workflows/${workflowId}/stages/${stageId}/edit`,
        delete: (workflowId: string, stageId: string) =>
          `/settings/workflows/${workflowId}/stages/${stageId}/delete`,
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
