-- Migration: V20260522165000__add_soft_delete_support.sql
-- Date: 2026-05-22
-- Description: Add is_deleted column for Soft Delete to support strict Project-Scoped IDs

-- 1. requirements table
ALTER TABLE requirements ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_req_project_sub_id_active ON requirements (project_id, project_sub_id) WHERE is_deleted = false;

-- 2. use_cases table
ALTER TABLE use_cases ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_uc_project_sub_id_active ON use_cases (project_id, project_sub_id) WHERE is_deleted = false;

-- 3. test_cases table
ALTER TABLE test_cases ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_tc_project_sub_id_active ON test_cases (project_id, project_sub_id) WHERE is_deleted = false;
