CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY,
    test_run_id BIGINT NOT NULL,
    execution_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    script TEXT NOT NULL,
    base_url VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    result JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP WITHOUT TIME ZONE,
    completed_at TIMESTAMP WITHOUT TIME ZONE
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS agent_token_hash VARCHAR(255);

-- Index for Agent poll query: findFirstByProjectIdAndStatusOrderByCreatedAtAsc
CREATE INDEX IF NOT EXISTS idx_agent_tasks_project_status ON agent_tasks(project_id, status, created_at);

-- Index for Watchdog timeout query: findByStatusAndClaimedAtBefore
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status_claimed ON agent_tasks(status, claimed_at);
