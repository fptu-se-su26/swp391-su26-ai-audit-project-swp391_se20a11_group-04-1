-- weekly_report_members: add completion metrics and AI output fields
ALTER TABLE weekly_report_members
    ADD COLUMN IF NOT EXISTS total_assigned_count     INT     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS completed_on_time_count  INT     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_comment               TEXT,
    ADD COLUMN IF NOT EXISTS ai_score                 INT,
    ADD COLUMN IF NOT EXISTS ai_evaluated_at          TIMESTAMP;

-- task_sla_states: add prediction feedback loop fields
ALTER TABLE task_sla_states
    ADD COLUMN IF NOT EXISTS prediction_accurate      BOOLEAN,
    ADD COLUMN IF NOT EXISTS prediction_confidence    DOUBLE PRECISION;
