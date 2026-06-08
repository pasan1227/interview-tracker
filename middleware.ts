import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  noOrgRequiredRoutes,
  orgOnboardingRoutes,
  publicRoutes,
} from '@/routes';
import NextAuth from 'next-auth';
import authConfig from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  if (nextUrl.pathname.startsWith(apiAuthPrefix)) return;

  if (authRoutes.includes(nextUrl.pathname)) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  if (!isLoggedIn && !publicRoutes.includes(nextUrl.pathname)) {
    const callbackUrl = nextUrl.pathname + nextUrl.search;
    return Response.redirect(
      new URL(
        `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        nextUrl
      )
    );
  }

  // Logged-in with no active organization → /select-org (or
  // /no-access if they belong to zero orgs, which we infer from the
  // empty orgs[]). Onboarding routes themselves are always allowed
  // so the chooser page can render. Auth-API + public routes already
  // returned above. Everything else (dashboard, settings, etc.)
  // requires an activeOrgId.
  if (isLoggedIn) {
    const activeOrgId = req.auth?.user?.activeOrgId;
    const orgs = req.auth?.user?.orgs ?? [];
    const onOnboarding = orgOnboardingRoutes.includes(nextUrl.pathname);
    const onNoOrgRoute = noOrgRequiredRoutes.some((r) =>
      nextUrl.pathname.startsWith(r)
    );
    if (
      !activeOrgId &&
      !onOnboarding &&
      !onNoOrgRoute &&
      !publicRoutes.includes(nextUrl.pathname)
    ) {
      const target = orgs.length === 0 ? '/no-access' : '/select-org';
      return Response.redirect(new URL(target, nextUrl));
    }
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
