-- Migration: V20260604152900__create_test_runs_table.sql
-- Date: 2026-06-04
-- Description: Create test_runs table (missing initial migration)

CREATE SEQUENCE IF NOT EXISTS test_runs_id_seq START 1;

CREATE TABLE IF NOT EXISTS test_runs (
    id BIGINT PRIMARY KEY DEFAULT nextval('test_runs_id_seq'),
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(200),
    is_saved BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
