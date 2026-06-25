-- Migration: V20260530121500__refactor_requirement_tags_to_array.sql
-- Date: 2026-05-30
-- Author: AI Assistant
-- Description: Refactor requirement tags from separate table to text array in requirements table

-- 1. Add new column to requirements
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Migrate existing data
UPDATE requirements r
SET tags = ARRAY(
    SELECT rt.tag 
    FROM requirement_tags rt 
    WHERE rt.requirement_id = r.id
);

-- 3. Drop the old table
DROP TABLE requirement_tags;

