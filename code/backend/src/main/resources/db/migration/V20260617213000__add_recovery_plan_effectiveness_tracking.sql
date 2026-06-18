ALTER TABLE recovery_plans
    ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS score_before_execution INT,
    ADD COLUMN IF NOT EXISTS score_after_execution INT,
    ADD COLUMN IF NOT EXISTS effectiveness_checked_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_recovery_plans_effectiveness_check
    ON recovery_plans (status, executed_at, effectiveness_checked_at);
