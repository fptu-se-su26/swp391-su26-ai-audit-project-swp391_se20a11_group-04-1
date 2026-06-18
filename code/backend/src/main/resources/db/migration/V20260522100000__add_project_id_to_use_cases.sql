-- Migration: V20260522100000__add_project_id_to_use_cases.sql
-- Description: Add project_id to use_cases, backfill data, add constraints, and missing indexes

-- 1. Add project_id as nullable
ALTER TABLE use_cases ADD COLUMN project_id BIGINT;

-- 2. Backfill existing data using a JOIN with the requirements table
UPDATE use_cases uc
SET project_id = r.project_id
FROM requirements r
WHERE uc.requirement_id = r.id;

-- 3. Alter column to NOT NULL after data is safely backfilled
-- Note: If there were any use cases without a requirement (should not happen based on schema), 
-- they might fail here. Assuming all use cases have a valid requirement.
ALTER TABLE use_cases ALTER COLUMN project_id SET NOT NULL;

-- 4. Add the foreign key constraint
ALTER TABLE use_cases
ADD CONSTRAINT fk_use_cases_project
FOREIGN KEY (project_id)
REFERENCES projects(id)
ON DELETE CASCADE;

-- 5. Create performance indexes for project scoping
CREATE INDEX IF NOT EXISTS idx_use_cases_project_id ON use_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_evidence_project_id ON evidence(project_id);
