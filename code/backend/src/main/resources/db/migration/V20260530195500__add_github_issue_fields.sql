-- Add GitHub Issue tracking fields to tasks and bug_reports

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_issue_number INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS github_issue_url VARCHAR(500);

ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS github_issue_number INTEGER;
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS github_issue_url VARCHAR(500);

