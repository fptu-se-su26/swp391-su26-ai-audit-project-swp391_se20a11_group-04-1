-- Add Playwright automation fields to test_cases table
ALTER TABLE test_cases
    ADD COLUMN base_url VARCHAR(500),
    ADD COLUMN steps_structured JSONB,
    ADD COLUMN cached_playwright_script TEXT,
    ADD COLUMN script_source VARCHAR(20),
    ADD COLUMN script_generated_at TIMESTAMP,
    ADD COLUMN last_run_status VARCHAR(10),
    ADD COLUMN last_run_at TIMESTAMP,
    ADD COLUMN last_run_id VARCHAR(100),
    ADD COLUMN run_count INTEGER NOT NULL DEFAULT 0;
