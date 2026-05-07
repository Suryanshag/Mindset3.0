-- =============================================================
-- Run AFTER sprint-A-add-presenters-and-workshop-payments.sql
-- (or `prisma db push` of the v1 schema) completes successfully.
-- Run BEFORE migration v2 (which makes presenter_id NOT NULL and
-- drops instructor_name).
--
-- Step 1: Find all unique instructor_name values that need presenter rows.
-- =============================================================

SELECT DISTINCT "instructorName"
FROM "Workshop"
WHERE "instructorName" IS NOT NULL
  AND "presenter_id" IS NULL
ORDER BY "instructorName";

-- =============================================================
-- Step 2: For each name above, create a Presenter row.
-- Replace examples below with your actual values.
-- Use unique cuid-style IDs (any random string starting with 'cl' or 'p_' works).
-- =============================================================

INSERT INTO presenters (id, name, title, tier, is_active, created_at, updated_at)
VALUES
  ('p_riya_mehta', 'Dr. Riya Mehta', 'Clinical Psychologist', 'PROFESSIONAL', true, NOW(), NOW()),
  ('p_arjun_das', 'Arjun Das', 'MA Psychology, DU', 'ASSOCIATE', true, NOW(), NOW());
  -- add more rows here...

-- =============================================================
-- Step 3: Link existing workshops to their presenter.
-- One UPDATE per unique instructor_name.
-- =============================================================

UPDATE "Workshop" SET "presenter_id" = 'p_riya_mehta' WHERE "instructorName" = 'Dr. Riya Mehta';
UPDATE "Workshop" SET "presenter_id" = 'p_arjun_das' WHERE "instructorName" = 'Arjun Das';
-- add more UPDATEs here...

-- =============================================================
-- Step 4: Verify no orphans before running migration v2.
-- Should return 0 rows.
-- =============================================================

SELECT id, title, "instructorName"
FROM "Workshop"
WHERE "presenter_id" IS NULL;
