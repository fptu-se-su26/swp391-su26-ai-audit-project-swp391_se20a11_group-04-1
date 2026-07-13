-- Add missing script_generated_at column that was missed in the previous migration due to Flyway already applying it
ALTER TABLE test_case_ui_configs ADD COLUMN IF NOT EXISTS script_generated_at TEXT;
