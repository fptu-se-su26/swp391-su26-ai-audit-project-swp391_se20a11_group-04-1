ALTER TABLE use_cases 
ADD COLUMN IF NOT EXISTS includes jsonb,
ADD COLUMN IF NOT EXISTS extends jsonb;

