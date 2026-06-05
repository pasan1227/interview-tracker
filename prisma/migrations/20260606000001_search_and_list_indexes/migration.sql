-- Search + list-page indexes from the round-5 audit.
--
-- pg_trgm GIN indexes back the ILIKE '%x%' search on candidate name/
-- email and interview title. Without these the search seq-scans the
-- table; with them, queries up to ~6-char prefixes are sub-millisecond.
--
-- Composite btrees back the most common list-page filter+sort
-- combinations. Single-column indexes can't combine into one for the
-- sort, so the planner currently does an index-scan-then-sort that
-- degrades with table size.
--
-- Production rollout note: CREATE INDEX (and CREATE EXTENSION on some
-- managed Postgres providers) take ACCESS EXCLUSIVE locks. On a hot
-- table run each CREATE INDEX separately as CREATE INDEX CONCURRENTLY
-- in a manual session (CONCURRENTLY can't live inside a transaction,
-- which is why Prisma's generated migration can't emit it).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Candidate search
CREATE INDEX "Candidate_name_trgm_idx"  ON "Candidate" USING GIN (lower("name")  gin_trgm_ops);
CREATE INDEX "Candidate_email_trgm_idx" ON "Candidate" USING GIN (lower("email") gin_trgm_ops);

-- Interview search
CREATE INDEX "Interview_title_trgm_idx" ON "Interview" USING GIN (lower("title") gin_trgm_ops);

-- Composite indexes for list-page WHERE+ORDER BY combinations.
CREATE INDEX "Candidate_status_createdAt_idx"     ON "Candidate" ("status", "createdAt" DESC);
CREATE INDEX "Candidate_positionId_createdAt_idx" ON "Candidate" ("positionId", "createdAt" DESC);
CREATE INDEX "Interview_status_startTime_idx"     ON "Interview" ("status", "startTime");
