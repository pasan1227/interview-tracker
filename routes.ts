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
