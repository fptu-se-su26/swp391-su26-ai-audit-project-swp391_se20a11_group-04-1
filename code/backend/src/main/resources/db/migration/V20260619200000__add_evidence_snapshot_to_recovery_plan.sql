ALTER TABLE recovery_plans 
ADD COLUMN IF NOT EXISTS evidence_snapshot_id BIGINT;
