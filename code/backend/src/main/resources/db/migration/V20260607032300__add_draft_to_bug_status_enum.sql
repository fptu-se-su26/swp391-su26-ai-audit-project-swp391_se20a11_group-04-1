-- =========================================================
-- Add DRAFT status to bug_status_enum
-- Purpose: Issues are created as DRAFT and require approval
--          before being promoted to OPEN and pushed to GitHub.
-- =========================================================

ALTER TYPE bug_status_enum ADD VALUE IF NOT EXISTS 'DRAFT' BEFORE 'OPEN';
