-- Fix: test_runs.id column type VARCHAR -> BIGINT to match Java entity Long
-- The sequence already generates numeric values, VARCHAR was wrong from the start.
-- First, delete any corrupt rows that have non-numeric IDs (e.g. "run_1779857210279_903fb098")
-- which were likely created by buggy mock scripts. These rows cannot have valid children in 
-- test_executions anyway, since test_executions.test_run_id is BIGINT.
DELETE FROM test_runs WHERE id !~ '^[0-9]+$';

ALTER TABLE test_runs ALTER COLUMN id TYPE BIGINT USING id::BIGINT;
