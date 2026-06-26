CREATE TABLE IF NOT EXISTS sprint_completion_summaries (
    id                   BIGSERIAL PRIMARY KEY,
    sprint_id            BIGINT NOT NULL UNIQUE REFERENCES sprints(id) ON DELETE CASCADE,
    project_id           BIGINT NOT NULL,
    total_tasks          INT NOT NULL DEFAULT 0,
    completed_tasks      INT NOT NULL DEFAULT 0,
    completed_on_time    INT NOT NULL DEFAULT 0,
    overdue_tasks        INT NOT NULL DEFAULT 0,
    penalized_tasks      INT NOT NULL DEFAULT 0,
    completion_rate      NUMERIC(5,2) NOT NULL DEFAULT 0,
    on_time_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
    ai_sprint_narrative  TEXT,
    member_summaries_json JSONB,
    generated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    generated_by         VARCHAR(50) NOT NULL DEFAULT 'AUTO'
);
