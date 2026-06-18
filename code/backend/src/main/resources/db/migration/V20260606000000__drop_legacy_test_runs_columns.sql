-- Drop legacy columns from test_runs
ALTER TABLE test_runs
DROP COLUMN IF EXISTS test_case_id,
DROP COLUMN IF EXISTS script_source,
DROP COLUMN IF EXISTS steps_result,
DROP COLUMN IF EXISTS duration_ms,
DROP COLUMN IF EXISTS error_message,
DROP COLUMN IF EXISTS failed_step,
DROP COLUMN IF EXISTS evidence_ids,
DROP COLUMN IF EXISTS bug_report_id,
DROP COLUMN IF EXISTS triggered_by,
DROP COLUMN IF EXISTS finished_at;
