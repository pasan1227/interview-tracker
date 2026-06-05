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
