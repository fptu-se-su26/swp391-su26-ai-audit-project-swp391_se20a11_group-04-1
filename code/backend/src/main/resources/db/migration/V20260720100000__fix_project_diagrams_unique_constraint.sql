-- BUG-1 FIX: Drop the old UNIQUE constraint on project_id so multiple modules can have diagrams per project
ALTER TABLE project_diagrams DROP CONSTRAINT IF EXISTS project_diagrams_project_id_key;

-- Add composite unique constraint instead: one diagram per (project, module) pair
ALTER TABLE project_diagrams ADD CONSTRAINT uq_project_diagrams_project_module UNIQUE (project_id, module_id);
