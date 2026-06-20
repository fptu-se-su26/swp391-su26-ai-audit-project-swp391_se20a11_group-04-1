-- Add end_date to projects table to track when a project is completed
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS end_date DATE NULL;

