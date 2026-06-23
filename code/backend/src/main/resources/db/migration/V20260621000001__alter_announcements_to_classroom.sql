-- Migration: V20260621000001__alter_announcements_to_classroom.sql
-- Description: Move announcements from projects to academic_contexts (classrooms)

ALTER TABLE announcements DROP CONSTRAINT IF EXISTS fk_announcements_project;
DROP INDEX IF EXISTS idx_announcements_project_id;

ALTER TABLE announcements RENAME COLUMN project_id TO classroom_id;

ALTER TABLE announcements ADD CONSTRAINT fk_announcements_classroom 
    FOREIGN KEY (classroom_id) REFERENCES academic_contexts(id) ON DELETE CASCADE;

CREATE INDEX idx_announcements_classroom_id ON announcements(classroom_id);
