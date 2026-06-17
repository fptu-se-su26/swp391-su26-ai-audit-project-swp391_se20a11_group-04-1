ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
UPDATE test_runs SET updated_at = created_at WHERE updated_at IS NULL;
