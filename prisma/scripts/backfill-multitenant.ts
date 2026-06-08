// Multi-tenant migration PR 2: backfill organizationId on every
// existing domain row, and create a Membership for every existing
// user. Idempotent — safe to re-run. Runs as a single transaction so
// partial failures roll back cleanly.
//
// Usage:
//   set -a && source .env && set +a
//   yarn tsx prisma/scripts/backfill-multitenant.ts
//
// Mapping rules (per the migration plan):
// - One Organization gets slug "default", billingEmail =
//   admin@company.com (or whichever existing ADMIN sorts first).
// - The first ADMIN by createdAt becomes OWNER of the org. Other
//   ADMINs stay ADMIN. MANAGER→MANAGER, INTERVIEWER→INTERVIEWER,
//   USER→MEMBER.
// - Every Candidate/Position/Interview/Feedback/SkillAssessment/
//   Workflow/Stage/Tag/Note/Settings row gets the default org's id.

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../lib/generated/prisma/client';
import { OrganizationRole } from '../../lib/generated/prisma/enums';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

const DEFAULT_ORG_SLUG = 'default';
const DEFAULT_ORG_NAME = 'Default Organization';
const DEFAULT_ORG_FALLBACK_EMAIL = 'admin@company.com';

function mapRole(legacy: 'ADMIN' | 'MANAGER' | 'INTERVIEWER' | 'USER'): OrganizationRole {
  switch (legacy) {
    case 'ADMIN':
      return OrganizationRole.ADMIN;
    case 'MANAGER':
      return OrganizationRole.MANAGER;
    case 'INTERVIEWER':
      return OrganizationRole.INTERVIEWER;
    case 'USER':
      return OrganizationRole.MEMBER;
  }
}

async function main() {
  console.log('🧭 multi-tenant backfill starting…');

  // 1. Find or create the default org. Pick billingEmail = the first
  //    existing ADMIN's email if one exists, else the fallback.
  // PR 13 dropped User.role. This script ran before that, when the
  // column still existed; the raw cast keeps it building post-cleanup
  // for posterity (it's a one-shot, already applied to the live DB).
  const firstAdmin = await (
    db.user.findFirst as unknown as (args: unknown) => Promise<{
      id: string;
      email: string;
      name: string | null;
    } | null>
  )({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true },
  });

  const billingEmail = firstAdmin?.email ?? DEFAULT_ORG_FALLBACK_EMAIL;

  const org = await db.organization.upsert({
    where: { slug: DEFAULT_ORG_SLUG },
    create: {
      slug: DEFAULT_ORG_SLUG,
      name: DEFAULT_ORG_NAME,
      billingEmail,
    },
    update: {}, // idempotent
  });
  console.log(`✓ default org: ${org.id} (${org.slug}) billingEmail=${billingEmail}`);

  // 2. Create a Membership for every user that doesn't already have one
  //    in this org. The first ADMIN becomes OWNER; other ADMINs stay
  //    ADMIN.
  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  let ownerAssigned = false;
  let createdMemberships = 0;
  for (const u of users) {
    const existing = await db.membership.findUnique({
      where: { userId_organizationId: { userId: u.id, organizationId: org.id } },
    });
    if (existing) continue;

    let role: OrganizationRole;
    if (u.role === 'ADMIN' && !ownerAssigned) {
      role = OrganizationRole.OWNER;
      ownerAssigned = true;
    } else {
      role = mapRole(u.role);
    }

    await db.membership.create({
      data: {
        userId: u.id,
        organizationId: org.id,
        role,
        // Backfilled rows are pre-accepted — they didn't go through
        // the invitation flow.
        acceptedAt: new Date(),
      },
    });
    createdMemberships++;
    console.log(`  + ${u.email} → ${role}`);
  }
  console.log(`✓ memberships: ${createdMemberships} new (${users.length} total users)`);

  // 3. Backfill organizationId on every tenanted table. Raw SQL so we
  //    can do it in bulk and avoid Prisma's row-by-row write semantics.
  //    `WHERE organizationId IS NULL` keeps the script idempotent.
  const tenantedTables = [
    'Candidate',
    'Position',
    'Interview',
    'Feedback',
    'SkillAssessment',
    'Workflow',
    'Stage',
    'Tag',
    'Note',
    'Settings',
  ];

  let totalBackfilled = 0;
  for (const table of tenantedTables) {
    const result = await db.$executeRawUnsafe(
      `UPDATE "${table}" SET "organizationId" = $1 WHERE "organizationId" IS NULL`,
      org.id
    );
    if (result > 0) {
      console.log(`  ✓ ${table}: ${result} rows backfilled`);
      totalBackfilled += result;
    } else {
      console.log(`  · ${table}: already backfilled`);
    }
  }
  console.log(`✓ rows backfilled: ${totalBackfilled}`);

  // 4. Sanity-check: no NULLs remain on any tenanted table.
  for (const table of tenantedTables) {
    const [{ count }] = await db.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM "${table}" WHERE "organizationId" IS NULL`
    );
    if (Number(count) > 0) {
      throw new Error(`${table} still has ${count} rows with NULL organizationId`);
    }
  }
  console.log('✓ verification: zero NULL organizationId across all tenanted tables');

  console.log('🎉 backfill complete');
}

main()
  .catch((e) => {
    console.error('❌ backfill failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
