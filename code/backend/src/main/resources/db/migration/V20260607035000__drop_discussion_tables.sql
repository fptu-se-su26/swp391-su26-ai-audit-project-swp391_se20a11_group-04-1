-- =========================================================
-- Drop Task Comments & Proposals tables (migrated to MongoDB)
-- =========================================================

DROP TABLE IF EXISTS task_proposal_comments CASCADE;
DROP TABLE IF EXISTS task_proposal_votes CASCADE;
DROP TABLE IF EXISTS task_proposals CASCADE;
DROP TABLE IF EXISTS task_comment_votes CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TYPE IF EXISTS proposal_status_enum CASCADE;
