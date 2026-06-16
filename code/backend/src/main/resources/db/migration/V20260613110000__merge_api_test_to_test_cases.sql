-- 1. Drop bảng cũ (dùng CASCADE để tự động drop các constraint liên quan)
DROP TABLE IF EXISTS api_test_result CASCADE;
DROP TABLE IF EXISTS api_test_case CASCADE;

-- 2. Thêm các cột cấu hình API vào bảng test_cases
ALTER TABLE test_cases 
ADD COLUMN api_method VARCHAR(10),
ADD COLUMN api_url VARCHAR(1000),
ADD COLUMN api_headers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN api_query_params JSONB DEFAULT '{}'::jsonb,
ADD COLUMN api_body JSONB,
ADD COLUMN api_assertions JSONB DEFAULT '[]'::jsonb;

-- 3. Tạo lại bảng api_test_result với reference tới test_cases
CREATE TABLE api_test_result (
    id BIGSERIAL PRIMARY KEY,
    test_case_id BIGINT NOT NULL,
    environment_id BIGINT,
    executed_by BIGINT,
    status VARCHAR(20) NOT NULL,
    status_code INT,
    response_time_ms INT,
    response_headers JSONB,
    response_body TEXT,
    assertion_results JSONB DEFAULT '[]'::jsonb NOT NULL,
    error_message TEXT,
    executed_via VARCHAR(20) NOT NULL,
    agent_task_id UUID,
    executed_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_api_test_result_test_case FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_api_test_result_environment FOREIGN KEY (environment_id) REFERENCES api_environment(id) ON DELETE SET NULL,
    CONSTRAINT fk_api_test_result_executed_by FOREIGN KEY (executed_by) REFERENCES user_accounts(id) ON DELETE SET NULL,
    CONSTRAINT fk_api_test_result_agent_task FOREIGN KEY (agent_task_id) REFERENCES agent_tasks(id) ON DELETE SET NULL
);
