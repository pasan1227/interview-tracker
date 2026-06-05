import { db } from '@/lib/db';

// Shared bootstrap fetch for /interviews/new and /interviews/[id]/edit.
// Three independent reads — fire in parallel so the form renders ~3x
// faster than the previous serial-await version. TODO: replace the
// full candidate/user list with a typed-search autocomplete once the
// rosters outgrow a single dropdown.
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
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
      }),
      db.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { candidates, positions, interviewers };
  } catch (error) {
    console.error('Failed to fetch interview form options:', error);
    return { candidates: [], positions: [], interviewers: [] };
  }
}
