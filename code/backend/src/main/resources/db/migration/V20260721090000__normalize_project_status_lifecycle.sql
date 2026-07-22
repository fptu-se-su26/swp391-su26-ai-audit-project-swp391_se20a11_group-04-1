-- Project lifecycle normalization:
-- - New projects should start ACTIVE, not PLANNING.
-- - Leader-closed projects should be COMPLETED, while ARCHIVED remains for archival/delete flows.

ALTER TABLE projects
    ALTER COLUMN status SET DEFAULT 'ACTIVE';

UPDATE projects
SET status = 'ACTIVE'
WHERE status = 'PLANNING';

UPDATE projects
SET status = 'COMPLETED'
WHERE status = 'ARCHIVED'
  AND closed_at IS NOT NULL;
