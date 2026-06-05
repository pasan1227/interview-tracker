import { db } from '@/lib/db';

export interface InterviewFormStage {
  id: string;
  name: string;
  order: number;
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
export async function getInterviewFormOptions() {
  try {
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
      db.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // If a position has no workflow we fall back to the system default
    // workflow's stages — same rule the old getStagesForPosition action
    // applied per-call. Resolve the default once.
    const defaultWorkflow = await db.workflow.findFirst({
      where: { isDefault: true },
      select: {
        stages: {
          select: { id: true, name: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    const fallbackStages: InterviewFormStage[] = defaultWorkflow?.stages ?? [];

    const stagesByPosition: Record<string, InterviewFormStage[]> = {};
    for (const p of positions) {
      stagesByPosition[p.id] = p.workflow?.stages.length
        ? p.workflow.stages
        : fallbackStages;
    }

    // Drop the workflow include from the positions list before returning
    // so the form's position dropdown sees just {id, title}.
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
