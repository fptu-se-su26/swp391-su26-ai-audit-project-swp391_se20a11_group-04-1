-- 1. Thêm các cột cho Playwright vào bảng test_cases
ALTER TABLE test_cases
    ADD COLUMN base_url                 VARCHAR(500),
    ADD COLUMN steps_structured         JSONB,
    ADD COLUMN cached_playwright_script TEXT,
    ADD COLUMN script_source            VARCHAR(20),
    ADD COLUMN script_generated_at      TIMESTAMP,
    ADD COLUMN last_run_status          VARCHAR(10),
    ADD COLUMN last_run_at              TIMESTAMP,
    ADD COLUMN last_run_id              VARCHAR(100),
    ADD COLUMN run_count                INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN test_cases.steps_structured IS 'Array JSON: [{order, action, selector, value, path, expected, description}]';
COMMENT ON COLUMN test_cases.script_source IS 'TEMPLATE | AI_GENERATED | MANUAL';
COMMENT ON COLUMN test_cases.last_run_status IS 'PASS | FAIL | ERROR | null';

-- 2. Tạo bảng test_runs
CREATE TABLE test_runs (
    id              VARCHAR(100) PRIMARY KEY,
    test_case_id    BIGINT       NOT NULL,
    project_id      BIGINT       NOT NULL,
    status          VARCHAR(10)  NOT NULL DEFAULT 'RUNNING',
    script_source   VARCHAR(20),
    steps_result    JSONB,
    duration_ms     INTEGER,
    error_message   TEXT,
    failed_step     TEXT,
    evidence_ids    JSONB,
    bug_report_id   BIGINT,
    triggered_by    BIGINT       NOT NULL,
    started_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_test_runs_test_case
        FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_runs_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_runs_triggered_by
        FOREIGN KEY (triggered_by) REFERENCES user_accounts(id),
    CONSTRAINT fk_test_runs_bug_report
        FOREIGN KEY (bug_report_id) REFERENCES bug_reports(id) ON DELETE SET NULL
);

CREATE INDEX idx_test_runs_test_case_id ON test_runs(test_case_id);
CREATE INDEX idx_test_runs_project_id   ON test_runs(project_id);
CREATE INDEX idx_test_runs_status       ON test_runs(status);
CREATE INDEX idx_test_runs_started_at   ON test_runs(started_at DESC);

-- 3. Thêm cột liên kết ngược từ bug_reports sang test_runs
ALTER TABLE bug_reports
    ADD COLUMN test_run_id  VARCHAR(100),
    ADD COLUMN auto_created BOOLEAN NOT NULL DEFAULT FALSE;
