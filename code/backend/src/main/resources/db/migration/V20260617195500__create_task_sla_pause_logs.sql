CREATE TABLE IF NOT EXISTS task_sla_pause_logs (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    paused_at TIMESTAMP NOT NULL,
    resumed_at TIMESTAMP NULL,
    reason TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_task_sla_pause_logs_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_sla_pause_logs_task_id ON task_sla_pause_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_sla_pause_logs_paused_at ON task_sla_pause_logs(paused_at);

CREATE UNIQUE INDEX uq_task_sla_pause_logs_open
ON task_sla_pause_logs(task_id)
WHERE resumed_at IS NULL;
