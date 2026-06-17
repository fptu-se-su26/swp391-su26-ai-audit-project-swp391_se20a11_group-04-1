-- Fix: migrate test_executions.environment from environment_enum → VARCHAR(20)
-- Root cause: Hibernate 7 sends VARCHAR for string/enum fields; PostgreSQL
-- refuses implicit cast to custom enum types.
-- Pattern: same fix already applied to test_executions.status in V20260605120000.
-- Note: environment_enum type is NOT dropped — still used by bug_reports.environment.
ALTER TABLE test_executions
    ALTER COLUMN environment TYPE VARCHAR(20)
    USING environment::VARCHAR;
