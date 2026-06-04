-- Add parent_id column to tasks table for sub-task hierarchy support
ALTER TABLE tasks ADD COLUMN parent_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE;
