-- Migration: V20260605120000__fix_test_execution_status_and_missing_columns.sql
-- Date: 2026-06-05
-- Author: AI
-- Description: Convert test_executions.status from PostgreSQL named enum to VARCHAR,
--              add missing columns (test_run_id, notes), and migrate legacy data.

-- ============================================================
-- 1. Add test_run_id column if missing (FK to test_runs)
-- ============================================================
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS test_run_id BIGINT;

-- ============================================================
-- 2. Add notes column if missing
-- ============================================================
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- 3. Convert test_executions.status from named enum → VARCHAR
-- PostgreSQL named enum 'test_execution_status_enum' only has
-- ('PASS', 'FAIL', 'BLOCKED') but async flow needs:
-- PENDING, RUNNING, PASSED, FAILED, SKIPPED, ABORTED
-- ============================================================

-- Step 3a: Add a temporary VARCHAR column
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS status_new VARCHAR(20);

-- Step 3b: Migrate existing data (convert old enum values to new ones)
UPDATE test_executions SET status_new = CASE
    WHEN status::text = 'PASS' THEN 'PASSED'
    WHEN status::text = 'FAIL' THEN 'FAILED'
    WHEN status::text = 'BLOCKED' THEN 'ABORTED'
    ELSE status::text
END
WHERE status_new IS NULL;

-- Step 3c: Drop old column and rename new one
ALTER TABLE test_executions DROP COLUMN IF EXISTS status;
ALTER TABLE test_executions RENAME COLUMN status_new TO status;

-- Step 3d: Set NOT NULL constraint and default
ALTER TABLE test_executions ALTER COLUMN status SET NOT NULL;
ALTER TABLE test_executions ALTER COLUMN status SET DEFAULT 'PENDING';
