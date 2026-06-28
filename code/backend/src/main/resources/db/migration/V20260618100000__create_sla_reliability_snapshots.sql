CREATE TABLE IF NOT EXISTS sla_reliability_snapshots (
    id                          BIGSERIAL    PRIMARY KEY,
    project_id                  BIGINT       NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id                   BIGINT       NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,

    -- MTTR: mean hours from HIGH/CRITICAL onset to recovery (NORMAL/LOW)
    mttr_hours                  DECIMAL(10,2),
    mttr_sample_count           INT          NOT NULL DEFAULT 0,

    -- MTBF: mean days between consecutive penalty events per task
    mtbf_days                   DECIMAL(10,2),
    mtbf_sample_count           INT          NOT NULL DEFAULT 0,

    -- Availability: % of evaluation intervals where score >= healthy_threshold
    availability_pct            DECIMAL(5,2),
    healthy_threshold           INT          NOT NULL DEFAULT 75,
    total_intervals             INT          NOT NULL DEFAULT 0,
    healthy_intervals           INT          NOT NULL DEFAULT 0,

    -- Error Budget
    budget_pct                  DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    total_tasks                 INT          NOT NULL DEFAULT 0,
    penalized_tasks             INT          NOT NULL DEFAULT 0,
    error_budget_consumed_pct   DECIMAL(5,2),
    error_budget_remaining_pct  DECIMAL(5,2),

    -- Gemini AI narrative (nullable)
    ai_narrative                TEXT,

    computed_at                 TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_reliability_snap UNIQUE (project_id, sprint_id)
);

CREATE INDEX IF NOT EXISTS idx_reliability_snap_project
    ON sla_reliability_snapshots(project_id);

CREATE INDEX IF NOT EXISTS idx_reliability_snap_sprint
    ON sla_reliability_snapshots(sprint_id);

CREATE INDEX IF NOT EXISTS idx_reliability_snap_computed
    ON sla_reliability_snapshots(computed_at DESC);
