ALTER TABLE recovery_plans
    ADD COLUMN IF NOT EXISTS is_follow_up BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE recovery_plan_actions
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_recovery_plans_follow_up_recent
    ON recovery_plans (project_id, task_id, generated_source, is_follow_up, created_at);
