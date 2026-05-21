-- Migration: V20260522005000__add_values_to_notification_type_enum.sql
-- Date: 2026-05-22
-- Author: Antigravity
-- Description: Add missing enum values to notification_type_enum to match Java NotificationType Enum

-- In PostgreSQL, ALTER TYPE ADD VALUE cannot be executed inside a transaction block in some versions,
-- but Flyway handles this gracefully. 
ALTER TYPE notification_type_enum ADD VALUE 'INVITATION';
ALTER TYPE notification_type_enum ADD VALUE 'SYSTEM';
ALTER TYPE notification_type_enum ADD VALUE 'MENTION';
