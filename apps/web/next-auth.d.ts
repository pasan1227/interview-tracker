import { OrganizationRole } from '@/lib/generated/prisma/enums';
import { type DefaultSession } from 'next-auth';

// Org slice carried through the JWT for the active organization.
export type SessionOrgMember = {
  id: string;
  slug: string;
  name: string;
  role: OrganizationRole;
};

export type ExtendedUser = DefaultSession['user'] & {
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  isPlatformAdmin: boolean;
  // Active organization (null on a brand-new login that hasn't picked
  // one yet — middleware then routes to /select-org).
  activeOrgId: string | null;
  activeOrgSlug: string | null;
  activeOrgRole: OrganizationRole | null;
  // Every org this user belongs to, for the switcher dropdown.
  orgs: SessionOrgMember[];
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
    isPlatformAdmin: boolean;
    activeOrgId: string | null;
    activeOrgSlug: string | null;
    activeOrgRole: OrganizationRole | null;
    orgs: SessionOrgMember[];
  }
}
