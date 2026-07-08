-- Create UI config table
CREATE TABLE test_case_ui_configs (
    id BIGSERIAL PRIMARY KEY,
    test_case_id BIGINT NOT NULL UNIQUE REFERENCES test_cases(id) ON DELETE CASCADE,
    base_url VARCHAR(255),
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    cached_playwright_script TEXT,
    script_source VARCHAR(20),
    script_generated_at TEXT
);

-- Create API config table
CREATE TABLE test_case_api_configs (
    id BIGSERIAL PRIMARY KEY,
    test_case_id BIGINT NOT NULL UNIQUE REFERENCES test_cases(id) ON DELETE CASCADE,
    api_method VARCHAR(10) NOT NULL,
    api_url TEXT NOT NULL,
    api_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
    api_query_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    api_body JSONB,
    api_assertions JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Create Unit config table
CREATE TABLE test_case_unit_configs (
    id BIGSERIAL PRIMARY KEY,
    test_case_id BIGINT NOT NULL UNIQUE REFERENCES test_cases(id) ON DELETE CASCADE
);

-- Create Integration config table
CREATE TABLE test_case_integration_configs (
    id BIGSERIAL PRIMARY KEY,
    test_case_id BIGINT NOT NULL UNIQUE REFERENCES test_cases(id) ON DELETE CASCADE
);

-- Migrate data from JSONB to Tables
INSERT INTO test_case_ui_configs (test_case_id, base_url, steps, cached_playwright_script, script_source, script_generated_at)
SELECT 
    id,
    configuration->>'baseUrl',
    COALESCE(configuration->'steps', '[]'::jsonb),
    configuration->>'cachedPlaywrightScript',
    configuration->>'scriptSource',
    configuration->>'scriptGeneratedAt'
FROM test_cases
WHERE type = 'UI' AND configuration IS NOT NULL;

INSERT INTO test_case_api_configs (test_case_id, api_method, api_url, api_headers, api_query_params, api_body, api_assertions)
SELECT 
    id,
    COALESCE(configuration->>'apiMethod', 'GET'),
    COALESCE(configuration->>'apiUrl', ''),
    COALESCE(configuration->'apiHeaders', '{}'::jsonb),
    COALESCE(configuration->'apiQueryParams', '{}'::jsonb),
    configuration->'apiBody',
    COALESCE(configuration->'apiAssertions', '[]'::jsonb)
FROM test_cases
WHERE type = 'API' AND configuration IS NOT NULL;

INSERT INTO test_case_unit_configs (test_case_id)
SELECT id FROM test_cases WHERE type = 'UNIT';

INSERT INTO test_case_integration_configs (test_case_id)
SELECT id FROM test_cases WHERE type = 'INTEGRATION';

-- Drop old JSONB column and raw columns if they still exist
ALTER TABLE test_cases 
    DROP COLUMN IF EXISTS configuration,
    DROP COLUMN IF EXISTS base_url,
    DROP COLUMN IF EXISTS steps_structured,
    DROP COLUMN IF EXISTS cached_playwright_script,
    DROP COLUMN IF EXISTS script_source,
    DROP COLUMN IF EXISTS api_method,
    DROP COLUMN IF EXISTS api_url,
    DROP COLUMN IF EXISTS api_headers,
    DROP COLUMN IF EXISTS api_query_params,
    DROP COLUMN IF EXISTS api_body,
    DROP COLUMN IF EXISTS api_assertions,
    DROP COLUMN IF EXISTS script_generated_at;
