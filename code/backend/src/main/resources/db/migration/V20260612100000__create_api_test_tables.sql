CREATE TABLE api_environment (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT NOT NULL REFERENCES projects(id),
    name        VARCHAR(100) NOT NULL,
    variables   JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMP DEFAULT now(),
    updated_at  TIMESTAMP DEFAULT now()
);

CREATE TABLE api_test_case (
    id           BIGSERIAL PRIMARY KEY,
    project_id   BIGINT NOT NULL REFERENCES projects(id),
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    method       VARCHAR(10) NOT NULL,
    url          VARCHAR(1000) NOT NULL,
    headers      JSONB DEFAULT '{}',
    query_params JSONB DEFAULT '{}',
    body         JSONB,
    assertions   JSONB NOT NULL DEFAULT '[]',
    created_by   BIGINT REFERENCES user_accounts(id),
    created_at   TIMESTAMP DEFAULT now(),
    updated_at   TIMESTAMP DEFAULT now()
);

CREATE TABLE api_test_result (
    id               BIGSERIAL PRIMARY KEY,
    api_test_case_id BIGINT NOT NULL REFERENCES api_test_case(id),
    environment_id   BIGINT REFERENCES api_environment(id),
    executed_by      BIGINT REFERENCES user_accounts(id),
    status           VARCHAR(20) NOT NULL,          -- PENDING | PASSED | FAILED | ERROR
    status_code      INT,
    response_time_ms INT,
    response_headers JSONB,
    response_body    TEXT,
    assertion_results JSONB NOT NULL DEFAULT '[]',
    error_message    TEXT,
    executed_via     VARCHAR(20) NOT NULL,          -- DIRECT | LOCAL_AGENT
    agent_task_id    UUID REFERENCES agent_tasks(id), -- Thêm FK để mapping lại event trả về từ Agent
    executed_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_api_test_result_case ON api_test_result(api_test_case_id);
