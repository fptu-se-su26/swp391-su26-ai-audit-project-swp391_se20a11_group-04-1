-- Fix: started_at on test_runs must be nullable.
-- Root cause: the original CREATE TABLE IF NOT EXISTS migration that defined started_at as NOT NULL
-- was lost. This migration drops that constraint so PENDING rows (which have no
-- started_at yet) can be inserted correctly.
-- started_at is only set when the TestRun transitions PENDING → RUNNING.
ALTER TABLE test_runs ALTER COLUMN started_at DROP NOT NULL;

