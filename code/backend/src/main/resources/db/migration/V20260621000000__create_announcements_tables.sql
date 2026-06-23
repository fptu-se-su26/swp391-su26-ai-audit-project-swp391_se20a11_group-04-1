-- Migration: V20260621000000__create_announcements_tables.sql
-- Description: Create announcements table and add MENTOR_ANNOUNCEMENT to notification_type_enum

-- Add MENTOR_ANNOUNCEMENT to notification_type_enum
ALTER TYPE notification_type_enum ADD VALUE 'MENTOR_ANNOUNCEMENT';

CREATE TABLE announcements (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachment_url VARCHAR(1000),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcements_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_announcements_sender FOREIGN KEY (sender_id) REFERENCES user_accounts(id) ON DELETE CASCADE
);

CREATE INDEX idx_announcements_project_id ON announcements(project_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
