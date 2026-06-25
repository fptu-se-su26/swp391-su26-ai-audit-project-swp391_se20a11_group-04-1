CREATE TABLE system_health_checks (
    id BIGSERIAL PRIMARY KEY,
    component VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    response_time_ms BIGINT,
    checked_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_health_checks_component ON system_health_checks(component, checked_at DESC);

CREATE TABLE monitored_job_stats (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    duration_ms BIGINT,
    error_message TEXT,
    consecutive_failures INT NOT NULL DEFAULT 0,
    executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_job_stats_name ON monitored_job_stats(job_name, executed_at DESC);
