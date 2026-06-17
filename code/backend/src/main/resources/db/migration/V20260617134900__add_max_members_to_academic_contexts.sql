-- Add max_members column to academic_contexts for classroom capacity management
ALTER TABLE academic_contexts ADD COLUMN max_members INTEGER NOT NULL DEFAULT 50;
