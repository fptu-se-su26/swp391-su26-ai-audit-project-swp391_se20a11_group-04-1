CREATE TABLE IF NOT EXISTS recovery_plan_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    recovery_plan_id BIGINT NOT NULL,
    recovery_plan_action_id BIGINT,
    project_id BIGINT NOT NULL,
    task_id BIGINT NOT NULL,
    actor_user_id BIGINT,
    event_type VARCHAR(60) NOT NULL,
    from_status VARCHAR(40),
    to_status VARCHAR(40),
    message TEXT,
    metadata_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recovery_plan_audit_logs_plan FOREIGN KEY (recovery_plan_id) REFERENCES recovery_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_recovery_plan_audit_logs_action FOREIGN KEY (recovery_plan_action_id) REFERENCES recovery_plan_actions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recovery_plan_audit_logs_plan_id ON recovery_plan_audit_logs(recovery_plan_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_plan_audit_logs_project_task ON recovery_plan_audit_logs(project_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_plan_audit_logs_event_type ON recovery_plan_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_recovery_plan_audit_logs_actor ON recovery_plan_audit_logs(actor_user_id);

