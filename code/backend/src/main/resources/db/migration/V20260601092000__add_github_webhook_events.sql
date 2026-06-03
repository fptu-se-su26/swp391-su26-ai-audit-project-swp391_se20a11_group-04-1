-- Webhook receiver foundation: store raw GitHub events fast, then later phases can normalize asynchronously.
ALTER TABLE github_repositories
    ADD COLUMN IF NOT EXISTS webhook_secret_encrypted TEXT;

CREATE TABLE IF NOT EXISTS github_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    repository_id BIGINT,
    delivery_id VARCHAR(100) NOT NULL UNIQUE,
    event_type VARCHAR(80) NOT NULL,
    signature VARCHAR(255),
    payload_hash VARCHAR(64) NOT NULL,
    payload_json JSONB NOT NULL,
    processed_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    CONSTRAINT fk_github_webhook_events_repository
        FOREIGN KEY (repository_id) REFERENCES github_repositories(id) ON DELETE SET NULL,
    CONSTRAINT chk_github_webhook_events_status
        CHECK (processed_status IN ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED'))
);

CREATE INDEX IF NOT EXISTS idx_github_webhook_events_repository_received
    ON github_webhook_events(repository_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_github_webhook_events_status
    ON github_webhook_events(processed_status);
