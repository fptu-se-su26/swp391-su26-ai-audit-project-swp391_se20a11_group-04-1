-- Add Playwright automation fields to test_cases table
ALTER TABLE test_cases
    ADD COLUMN IF NOT EXISTS base_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS steps_structured JSONB,
    ADD COLUMN IF NOT EXISTS cached_playwright_script TEXT,
    ADD COLUMN IF NOT EXISTS script_source VARCHAR(20),
    ADD COLUMN IF NOT EXISTS script_generated_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_run_status VARCHAR(10),
    ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_run_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS run_count INTEGER NOT NULL DEFAULT 0;
