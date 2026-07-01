-- Migration: Add is_deleted column to projects table
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to optimize querying non-deleted projects
CREATE INDEX IF NOT EXISTS idx_projects_is_deleted ON projects (is_deleted);
