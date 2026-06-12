ALTER TABLE outbox_events
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_outbox_events_retry
    ON outbox_events(status, retry_count, next_retry_at, created_at);
