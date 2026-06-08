-- Second pass of indexes for queries flagged in the High-tier audit.
-- Each one is justified by a real WHERE / ORDER BY / GROUP BY that hits
-- the table today.
--
-- Production rollout note: CREATE INDEX takes an ACCESS EXCLUSIVE lock and
-- blocks writes while it builds. On a hot table run each statement
-- separately as CREATE INDEX CONCURRENTLY in a manual session — that flag
-- can't live inside a transaction, which is why Prisma's generated
-- migration can't emit it.

-- Reports filter HIRED candidates by updatedAt range (getTimeToHireReport,
-- getMonthlyHiresReport). Without the index every report run sequential-
-- scans Candidate.
CREATE INDEX "Candidate_updatedAt_idx" ON "Candidate"("updatedAt");

-- interviews/new + interviews/[id]/edit fetch all isActive candidates for
-- the dropdown.
CREATE INDEX "Candidate_isActive_idx" ON "Candidate"("isActive");

-- Positions list (and the candidate-form position dropdown) filter by
-- isActive.
CREATE INDEX "Position_isActive_idx" ON "Position"("isActive");

-- getSafeUsers filters by role (excludes admins from non-admin lookups).
CREATE INDEX "User_role_idx" ON "User"("role");

-- getFeedbacksByInterviewer orders by createdAt scoped to interviewerId.
-- The composite covers both the equality and the sort in one btree.
CREATE INDEX "Feedback_interviewerId_createdAt_idx" ON "Feedback"("interviewerId", "createdAt");

-- Stage lookups always come scoped by workflowId AND ordered by `order`.
-- The composite supersedes "Stage_workflowId_idx" for ordered reads; we
-- keep the single-column index in place because Postgres can still use it
-- for plain equality, and dropping it requires a separate rollout.
CREATE INDEX "Stage_workflowId_order_idx" ON "Stage"("workflowId", "order");
