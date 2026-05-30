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

-- Thêm link ngược từ bug_reports sang test_run
ALTER TABLE bug_reports
    ADD COLUMN test_run_id  VARCHAR(100),
    ADD COLUMN auto_created BOOLEAN NOT NULL DEFAULT FALSE;