-- Add reject_reason column to use_cases table
ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS reject_reason TEXT;
