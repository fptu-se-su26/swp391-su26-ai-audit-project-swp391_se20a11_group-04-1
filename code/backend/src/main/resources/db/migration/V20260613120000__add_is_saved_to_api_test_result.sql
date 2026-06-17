-- Add is_saved flag to api_test_result table
-- Default to false so existing results remain as unsaved drafts
ALTER TABLE api_test_result ADD COLUMN IF NOT EXISTS is_saved BOOLEAN NOT NULL DEFAULT false;

-- Mark all existing results as saved to preserve history
UPDATE api_test_result SET is_saved = true WHERE is_saved = false;
