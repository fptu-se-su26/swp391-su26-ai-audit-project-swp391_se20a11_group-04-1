-- Make test_run_id and execution_id nullable to support API_TEST_JOB
ALTER TABLE agent_tasks ALTER COLUMN test_run_id DROP NOT NULL;
ALTER TABLE agent_tasks ALTER COLUMN execution_id DROP NOT NULL;
