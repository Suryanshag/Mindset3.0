-- Perf: hot-path indexes for the /user home + spine + reflection queries.
-- Additive (one DROP of a strictly-redundant index). Index names match the
-- Prisma defaults for the schema.prisma changes in the same commit, so a
-- future `prisma db push` sees them as already-present and stays in sync.
--
-- Apply (outside a transaction — CONCURRENTLY cannot run in one):
--   npx prisma db execute --file ./prisma/sql/perf_indexes_user_home.sql \
--     --schema ./prisma/schema.prisma
--
-- CONCURRENTLY keeps the tables writable during the build (no app downtime).

-- Session had NO indexes. Every (userId, date, status) lookup was a seq scan:
-- getUpcomingSession, getUserEngagementState, getSpineTherapist,
-- getReflectionLandingData (multiple queries each).
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Session_userId_date_status_idx"
  ON "Session" ("userId", "date", "status");

-- Assignment: widen (userId, status) -> (userId, status, dueDate) for the
-- "due today" home filter + ORDER BY dueDate. The composite is a superset
-- prefix of the old index, so the old one is now redundant.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assignment_userId_status_dueDate_idx"
  ON "Assignment" ("userId", "status", "dueDate");

DROP INDEX CONCURRENTLY IF EXISTS "Assignment_userId_status_idx";
