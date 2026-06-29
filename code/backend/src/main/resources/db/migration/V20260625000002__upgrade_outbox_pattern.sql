ALTER TABLE outbox_events ADD COLUMN idempotency_key VARCHAR(64) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;

CREATE TABLE dead_letter_events (
    id BIGSERIAL PRIMARY KEY,
    original_event_id BIGINT,
    event_type VARCHAR(100),
    aggregate_id VARCHAR(100),
    payload TEXT,
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    last_retry_at TIMESTAMP,
    retry_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE processed_events (
    idempotency_key VARCHAR(64) PRIMARY KEY,
    consumer_id VARCHAR(100),
    processed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_processed_events_processed_at ON processed_events(processed_at);
