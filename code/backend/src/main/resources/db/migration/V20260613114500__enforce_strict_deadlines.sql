-- V20260613114500__enforce_strict_deadlines.sql
-- Description: Make start_date and deadline NOT NULL across projects and tasks

-- 1. Projects table
-- First, populate any missing start_dates with current date
UPDATE projects
SET start_date = CURRENT_DATE
WHERE start_date IS NULL;

-- Then alter the column
ALTER TABLE projects ALTER COLUMN start_date SET NOT NULL;

-- 2. Tasks table
-- Populate missing start_dates (if any remaining)
UPDATE tasks
SET start_date = CURRENT_DATE
WHERE start_date IS NULL;

UPDATE tasks
SET deadline = CURRENT_DATE + INTERVAL '7 days'
WHERE deadline IS NULL;


-- Alter both columns to be NOT NULL
ALTER TABLE tasks ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN deadline SET NOT NULL;
