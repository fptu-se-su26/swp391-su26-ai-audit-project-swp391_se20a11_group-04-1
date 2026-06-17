ALTER TABLE test_cases
ADD COLUMN base_url VARCHAR(500),
ADD COLUMN steps_structured JSONB,
ADD COLUMN cached_playwright_script TEXT,
ADD COLUMN script_source VARCHAR(20),
ADD COLUMN script_generated_at TIMESTAMP,
ADD COLUMN last_run_status VARCHAR(10),
ADD COLUMN last_run_at TIMESTAMP,
ADD COLUMN last_run_id VARCHAR(100),
ADD COLUMN run_count INT NOT NULL DEFAULT 0;

CREATE TABLE test_runs (
    id VARCHAR(100) PRIMARY KEY,
    test_case_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'RUNNING',
    script_source VARCHAR(20),
    steps_result JSONB,
    duration_ms INT,
    error_message TEXT,
    failed_step TEXT,
    evidence_ids JSONB,
    bug_report_id BIGINT,
    triggered_by BIGINT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);
