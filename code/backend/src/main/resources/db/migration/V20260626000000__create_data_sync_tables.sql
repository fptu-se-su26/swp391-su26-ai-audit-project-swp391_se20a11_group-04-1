CREATE TABLE entity_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    duration_ms BIGINT,
    error_message TEXT,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);
CREATE INDEX idx_entity_sync_logs_status ON entity_sync_logs(status);
CREATE INDEX idx_entity_sync_logs_entity ON entity_sync_logs(entity_type, entity_id);

CREATE TABLE sync_status (
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    last_synced_at TIMESTAMP,
    sync_version BIGINT NOT NULL DEFAULT 0,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (entity_type, entity_id)
);
