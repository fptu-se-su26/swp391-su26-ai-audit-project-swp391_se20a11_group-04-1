CREATE TABLE architecture_syncs (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    progress INT NOT NULL DEFAULT 0,
    current_step VARCHAR(255),
    last_commit_sha VARCHAR(100),
    branch VARCHAR(100),
    last_sync_at TIMESTAMP,
    synced_by BIGINT,
    mongo_graph_id VARCHAR(100),
    CONSTRAINT fk_arch_sync_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_arch_sync_user FOREIGN KEY (synced_by) REFERENCES user_accounts(id) ON DELETE SET NULL
);
