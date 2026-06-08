import { auth } from '@/auth';
import { cache } from 'react';

export const getSession = cache(async () => auth());

export const getCurrentUser = async () => {
  const session = await getSession();
  return session?.user;
};

// PR 13: User.role is gone. Authorization lives on Membership now;
// callers that used currentRole() should use session.user.activeOrgRole
// (or requireOrgRole / requirePageOrgRole in lib/authz).
