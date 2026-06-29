-- Migration: V20260522160000__add_project_sub_id_and_code.sql
-- Date: 2026-05-22
-- Author: Antigravity
-- Description: Add project_sub_id and code to requirements, and project_sub_id to use_cases, tasks, test_cases

-- 1. requirements table
ALTER TABLE requirements ADD COLUMN project_sub_id INT;
ALTER TABLE requirements ADD COLUMN req_code VARCHAR(50);
CREATE INDEX idx_req_project_sub_id ON requirements (project_id, project_sub_id);

-- 2. use_cases table
ALTER TABLE use_cases ADD COLUMN project_sub_id INT;
-- Note: use_cases already has 'code' column based on earlier inspections
CREATE INDEX idx_uc_project_sub_id ON use_cases (project_id, project_sub_id);

-- 3. tasks table
ALTER TABLE tasks ADD COLUMN project_sub_id INT;
ALTER TABLE tasks ADD COLUMN task_code VARCHAR(50);
CREATE INDEX idx_task_project_sub_id ON tasks (project_id, project_sub_id);

-- 4. test_cases table
ALTER TABLE test_cases ADD COLUMN project_sub_id INT;
ALTER TABLE test_cases ADD COLUMN tc_code VARCHAR(50);
CREATE INDEX idx_tc_project_sub_id ON test_cases (project_id, project_sub_id);
