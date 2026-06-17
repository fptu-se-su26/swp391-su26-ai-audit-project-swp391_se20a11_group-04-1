-- Migration: V20260604153000__async_test_run_support.sql
-- Date: 2026-06-04
-- Author: AI
-- Description: Add columns for async test run support and create shedlock table

-- ============================================================
-- test_runs: thêm các cột cho async flow
-- ============================================================
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(36);
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS total_test_cases INT NOT NULL DEFAULT 0;
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS completed_count INT NOT NULL DEFAULT 0;
-- created_by FK (nếu chưa có)
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES user_accounts(id);

CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
-- Partial index cho watchdog query (chỉ index RUNNING rows)
CREATE INDEX IF NOT EXISTS idx_test_runs_running_updated
    ON test_runs(updated_at) WHERE status = 'RUNNING';

-- ============================================================
-- test_executions: thêm các cột cho granular tracking
-- ============================================================
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS duration_ms BIGINT;
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS screenshot_url VARCHAR(500);
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;

-- Unique index cho idempotency (WHERE để không conflict với NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_execution_idempotency
    ON test_executions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================================
-- ShedLock table (dùng bởi watchdog scheduler)
-- ============================================================
CREATE TABLE IF NOT EXISTS shedlock (
    name        VARCHAR(64)  NOT NULL,
    lock_until  TIMESTAMP    NOT NULL,
    locked_at   TIMESTAMP    NOT NULL,
    locked_by   VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
