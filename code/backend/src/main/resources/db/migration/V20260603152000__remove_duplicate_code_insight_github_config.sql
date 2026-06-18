-- Code Insight now uses the shared GitHub Integration module as the repository/webhook source of truth.
-- Keep project_code_insight_settings; only remove the duplicate Code Insight GitHub config tables.
DROP TABLE IF EXISTS github_webhook_events;
DROP TABLE IF EXISTS github_repositories;
