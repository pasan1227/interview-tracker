import { db } from '@/lib/db';
import { UserRole } from '@/lib/generated/prisma/browser';

export interface InterviewFormStage {
  id: string;
  name: string;
  order: number;
}

interface GetInterviewFormOptionsArgs {
  viewerRole: UserRole;
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
export async function getInterviewFormOptions({
  viewerRole,
}: GetInterviewFormOptionsArgs) {
  try {
    // Only manager/admin sees the interviewer roster + emails. INTERVIEWER
    // and USER roles reach this fetch when they're listed on an existing
    // interview's edit page, but their writable surface is restricted to
    // notes/status (see actions/interview.ts updateInterview) — so they
    // don't need to mutate the roster and shouldn't see every employee's
    // email address.
    const canSeeRoster =
      viewerRole === UserRole.ADMIN || viewerRole === UserRole.MANAGER;

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
      canSeeRoster
        ? db.user.findMany({
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([] as { id: string; name: string | null; email: string }[]),
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
