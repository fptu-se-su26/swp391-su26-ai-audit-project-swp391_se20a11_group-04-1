CREATE TABLE IF NOT EXISTS sla_action_logs (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    task_id BIGINT NOT NULL,
    recipient_id BIGINT NULL,
    action_type VARCHAR(50) NOT NULL,
    sla_category VARCHAR(50),
    action_key VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL,
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sla_action_logs_project
        FOREIGN KEY (project_id)
            REFERENCES projects(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_sla_action_logs_task
        FOREIGN KEY (task_id)
            REFERENCES tasks(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_sla_action_logs_recipient
        FOREIGN KEY (recipient_id)
            REFERENCES user_accounts(id)
            ON DELETE SET NULL,

    CONSTRAINT uq_sla_action_logs_key UNIQUE(action_key)
);

CREATE INDEX IF NOT EXISTS idx_sla_action_logs_project ON sla_action_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_sla_action_logs_task ON sla_action_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_sla_action_logs_recipient ON sla_action_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_sla_action_logs_created ON sla_action_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sla_action_logs_action_type ON sla_action_logs(action_type);
