-- Add indexes for the queries that hit each table the hardest today.
-- Every index here is justified by an existing WHERE / ORDER BY / FK join
-- in data/*.ts. See the PR description for the per-index rationale.
--
-- All indexes are btree. None are partial or composite — kept simple so the
-- planner can mix and match. Add composites later if EXPLAIN ANALYZE on a
-- specific query shows it would help.
--
-- Production rollout note: CREATE INDEX takes an ACCESS EXCLUSIVE lock on
-- the table and blocks writes while it builds. If this app already has
-- meaningful traffic, run each statement separately as
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS "..." ON "..." ("...");
-- in a manual session (cannot be inside a transaction, which is why
-- Prisma's generated migration can't use it). For a fresh / small DB
-- this file is fine as-is.

-- CreateIndex
CREATE INDEX "Candidate_status_idx" ON "Candidate"("status");

-- CreateIndex
CREATE INDEX "Candidate_positionId_idx" ON "Candidate"("positionId");

-- CreateIndex
CREATE INDEX "Candidate_source_idx" ON "Candidate"("source");

-- CreateIndex
CREATE INDEX "Candidate_createdAt_idx" ON "Candidate"("createdAt");

-- CreateIndex
CREATE INDEX "Interview_startTime_idx" ON "Interview"("startTime");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE INDEX "Interview_candidateId_idx" ON "Interview"("candidateId");

-- CreateIndex
CREATE INDEX "Interview_positionId_idx" ON "Interview"("positionId");

-- CreateIndex
CREATE INDEX "Feedback_interviewerId_idx" ON "Feedback"("interviewerId");

-- CreateIndex
CREATE INDEX "Feedback_candidateId_idx" ON "Feedback"("candidateId");

-- CreateIndex
CREATE INDEX "Feedback_interviewId_idx" ON "Feedback"("interviewId");

-- CreateIndex
CREATE INDEX "SkillAssessment_feedbackId_idx" ON "SkillAssessment"("feedbackId");

-- CreateIndex
CREATE INDEX "Stage_workflowId_idx" ON "Stage"("workflowId");

-- CreateIndex
CREATE INDEX "Note_candidateId_idx" ON "Note"("candidateId");
