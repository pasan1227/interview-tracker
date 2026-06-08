import { tenantDb, type OrgContext } from '@/lib/tenant-db';

export interface InterviewFormStage {
  id: string;
  name: string;
  order: number;
}

interface GetInterviewFormOptionsArgs {
  // True when the viewer is allowed to see the full interviewer roster
  // (manager+ inside the org). False suppresses the user list.
  canSeeRoster: boolean;
}

// Shared bootstrap fetch for /interviews/new and /interviews/[id]/edit.
// All reads fan out in parallel so the form renders ~3x faster than the
// previous serial-await version.
//
// stagesByPosition replaces the per-position client→server roundtrip
// that useStagesForPosition used to do on every position change.
// Active positions all fit in one bounded query (position → workflow →
// stages), so we just precompute the map. TODO: switch the candidate
// and user dropdowns to typed-search autocomplete once the rosters
// outgrow a single dropdown.
//
// PR 8: scoped to the active org. The interviewer roster now means
// "users with a Membership in this org", not "all users in the
// platform" — fetched via the Membership table rather than User.
export async function getInterviewFormOptions(
  ctx: OrgContext,
  { canSeeRoster }: GetInterviewFormOptionsArgs
) {
  try {
    const db = tenantDb(ctx);

    const [candidates, positions, interviewers] = await Promise.all([
      db.candidate.findMany({
        where: { isActive: true },
        select: { id: true, name: true, positionId: true },
        orderBy: { name: 'asc' },
      }),
      db.position.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          workflow: {
            select: {
              isDefault: true,
              stages: {
                select: { id: true, name: true, order: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
        orderBy: { title: 'asc' },
      }),
      // Roster is org-scoped: members of THIS organization, not the
      // global User table. Membership is tenanted, so tenantDb adds
      // the org filter automatically.
      canSeeRoster
        ? db.membership
            .findMany({
              where: { status: 'ACTIVE' },
              select: {
                user: { select: { id: true, name: true, email: true } },
              },
              orderBy: { user: { name: 'asc' } },
            })
            .then((rows) => rows.map((r) => r.user))
        : Promise.resolve(
            [] as { id: string; name: string | null; email: string }[]
          ),
    ]);

    // If a position has no workflow we fall back to a default-flagged
    // workflow's stages. The position query already pulls the workflow's
    // isDefault flag, so pick from the results without a 4th round-trip.
    const fallbackStages: InterviewFormStage[] =
      positions.find((p) => p.workflow?.isDefault)?.workflow?.stages ?? [];

    const stagesByPosition: Record<string, InterviewFormStage[]> = {};
    for (const p of positions) {
      stagesByPosition[p.id] = p.workflow?.stages.length
        ? p.workflow.stages
        : fallbackStages;
    }

    return {
      candidates,
      positions: positions.map((p) => ({ id: p.id, title: p.title })),
      interviewers,
      stagesByPosition,
    };
  } catch (error) {
    console.error('Failed to fetch interview form options:', error);
    return {
      candidates: [],
      positions: [],
      interviewers: [],
      stagesByPosition: {},
    };
  }
}
