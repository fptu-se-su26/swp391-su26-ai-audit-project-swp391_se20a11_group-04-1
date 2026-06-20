-- Add new columns for AcademicSeason, AcademicContextStatus, and dates
ALTER TABLE academic_contexts
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS start_date DATE NULL,
ADD COLUMN IF NOT EXISTS end_date DATE NULL;

-- Update existing data if any (e.g., 'SU26' -> 'SUMMER')
UPDATE academic_contexts SET semester = 'SPRING' WHERE semester LIKE 'SP%';
UPDATE academic_contexts SET semester = 'SUMMER' WHERE semester LIKE 'SU%';
UPDATE academic_contexts SET semester = 'FALL' WHERE semester LIKE 'FA%';
UPDATE academic_contexts SET semester = 'BONUS' WHERE semester NOT IN ('SPRING', 'SUMMER', 'FALL');

