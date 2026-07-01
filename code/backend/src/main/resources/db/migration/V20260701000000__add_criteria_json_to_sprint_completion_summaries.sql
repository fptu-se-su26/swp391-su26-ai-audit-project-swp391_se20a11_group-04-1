ALTER TABLE sprint_completion_summaries
ADD COLUMN IF NOT EXISTS criteria_json TEXT;
