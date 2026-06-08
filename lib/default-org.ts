// Bridge helper used by actions that create domain rows before the
// auth/session refactor (PR 5) wires activeOrgId into the session.
// Every legacy action falls back to this single "default" org so
// the NOT NULL constraint added in PR 3 is satisfied. Once PR 5–10
// land, the relevant actions get an OrgContext and stop calling
// this helper. PR 13 deletes the file.

import { cache } from 'react';
import { db } from './db';

export const getDefaultOrganizationId = cache(async (): Promise<string> => {
  const org = await db.organization.findUnique({
    where: { slug: 'default' },
    select: { id: true },
  });
  if (!org) {
    throw new Error(
      'No "default" organization found. Run prisma/scripts/backfill-multitenant.ts first.'
    );
  }
  return org.id;
});
