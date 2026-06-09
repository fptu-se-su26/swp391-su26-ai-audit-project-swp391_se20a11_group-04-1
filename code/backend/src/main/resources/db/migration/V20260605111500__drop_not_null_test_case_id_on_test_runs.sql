-- Allow null for test_case_id because TestRun now supports multiple test cases via TestExecution
ALTER TABLE test_runs ALTER COLUMN test_case_id DROP NOT NULL;
