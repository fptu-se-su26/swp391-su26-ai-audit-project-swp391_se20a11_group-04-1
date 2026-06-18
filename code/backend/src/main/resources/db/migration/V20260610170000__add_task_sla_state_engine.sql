CREATE TABLE IF NOT EXISTS task_sla_states (
    task_id BIGINT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    sprint_id BIGINT,
    assignee_id BIGINT,
    current_risk_level VARCHAR(30) NOT NULL,
    current_score INT NOT NULL,
    categories_json JSONB NOT NULL,
    reasons_json JSONB NOT NULL,
    recommended_action TEXT,
    overdue_days BIGINT NOT NULL DEFAULT 0,
    days_until_deadline BIGINT,
    has_accepted_evidence BOOLEAN NOT NULL DEFAULT FALSE,
    penalty_applied BOOLEAN NOT NULL DEFAULT FALSE,
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_task_sla_states_task
        FOREIGN KEY (task_id)
            REFERENCES tasks(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_task_sla_states_project
        FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_task_sla_states_assignee
        FOREIGN KEY (assignee_id)
            REFERENCES user_accounts(id)
            ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_task_sla_states_project ON task_sla_states(project_id);
CREATE INDEX IF NOT EXISTS idx_task_sla_states_sprint ON task_sla_states(sprint_id);
CREATE INDEX IF NOT EXISTS idx_task_sla_states_assignee ON task_sla_states(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_sla_states_risk ON task_sla_states(current_risk_level);
CREATE INDEX IF NOT EXISTS idx_task_sla_states_evaluated ON task_sla_states(evaluated_at);

CREATE TABLE IF NOT EXISTS sla_decision_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    sprint_id BIGINT,
    assignee_id BIGINT,
    event_type VARCHAR(100),
    previous_risk_level VARCHAR(30),
    new_risk_level VARCHAR(30) NOT NULL,
    previous_score INT,
    new_score INT NOT NULL,
    categories_json JSONB NOT NULL,
    reasons_json JSONB NOT NULL,
    recommended_action TEXT,
    action_taken VARCHAR(100),
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sla_decision_logs_task
        FOREIGN KEY (task_id)
            REFERENCES tasks(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_sla_decision_logs_project
        FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_sla_decision_logs_assignee
        FOREIGN KEY (assignee_id)
            REFERENCES user_accounts(id)
            ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sla_decision_logs_task ON sla_decision_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_sla_decision_logs_project ON sla_decision_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_sla_decision_logs_sprint ON sla_decision_logs(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sla_decision_logs_assignee ON sla_decision_logs(assignee_id);
CREATE INDEX IF NOT EXISTS idx_sla_decision_logs_evaluated ON sla_decision_logs(evaluated_at);
