CREATE TABLE recovery_plans (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    sprint_id BIGINT,
    task_id BIGINT NOT NULL,
    generated_by_user_id BIGINT,
    generated_source VARCHAR(30) NOT NULL DEFAULT 'RULE',
    status VARCHAR(40) NOT NULL,
    risk_level VARCHAR(30),
    risk_categories_json JSONB NOT NULL DEFAULT '[]',
    summary TEXT,
    approved_by BIGINT,
    approved_at TIMESTAMP,
    rejected_by BIGINT,
    rejected_at TIMESTAMP,
    reject_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recovery_plan_actions (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    task_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_user_id BIGINT,
    status VARCHAR(40) NOT NULL,
    priority VARCHAR(20),
    message TEXT,
    payload_json JSONB NOT NULL DEFAULT '{}',
    idempotency_key VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP,
    result_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recovery_plan_actions_plan FOREIGN KEY (plan_id) REFERENCES recovery_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_recovery_plans_project_task_created ON recovery_plans(project_id, task_id, created_at);
CREATE INDEX idx_recovery_plan_actions_plan_id ON recovery_plan_actions(plan_id);
CREATE INDEX idx_recovery_plan_actions_project_task ON recovery_plan_actions(project_id, task_id);
CREATE UNIQUE INDEX uk_recovery_plan_actions_idempotency ON recovery_plan_actions(idempotency_key);
