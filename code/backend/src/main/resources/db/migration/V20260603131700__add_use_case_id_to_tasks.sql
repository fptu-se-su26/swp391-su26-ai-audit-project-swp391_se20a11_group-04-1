ALTER TABLE tasks ADD COLUMN use_case_id BIGINT;
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_use_case FOREIGN KEY (use_case_id) REFERENCES use_cases(id) ON DELETE SET NULL;
