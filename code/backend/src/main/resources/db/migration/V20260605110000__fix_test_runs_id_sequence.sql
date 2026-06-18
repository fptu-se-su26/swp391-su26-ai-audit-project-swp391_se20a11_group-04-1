-- Tạo sequence cho test_runs.id
CREATE SEQUENCE IF NOT EXISTS test_runs_id_seq;

-- Sync sequence với data hiện có (bỏ qua các id chứa chữ như 'run_1779...')
SELECT setval('test_runs_id_seq', COALESCE((SELECT MAX(id::BIGINT) FROM test_runs WHERE id::text ~ '^[0-9]+$'), 0) + 1, false);

-- Gán sequence làm DEFAULT cho cột id
ALTER TABLE test_runs ALTER COLUMN id SET DEFAULT nextval('test_runs_id_seq');

