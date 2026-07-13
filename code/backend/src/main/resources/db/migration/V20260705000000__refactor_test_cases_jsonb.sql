-- 1. Add new JSONB column
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS configuration JSONB;

-- 2. Migrate UI test cases
UPDATE test_cases SET configuration = jsonb_build_object(
    'type', 'UI',
    'baseUrl', NULLIF(base_url, 'null'),
    'steps', steps_structured::jsonb,
    'cachedPlaywrightScript', cached_playwright_script,
    'scriptSource', script_source
) WHERE type = 'UI';

-- 3. Migrate API test cases
UPDATE test_cases SET configuration = jsonb_build_object(
    'type', 'API',
    'apiMethod', api_method,
    'apiUrl', api_url,
    'apiHeaders', api_headers::jsonb,
    'apiQueryParams', api_query_params::jsonb,
    'apiBody', api_body::jsonb,
    'apiAssertions', api_assertions::jsonb
) WHERE type = 'API';

-- 4. Migrate MANUAL, UNIT, INTEGRATION test cases
UPDATE test_cases SET configuration = jsonb_build_object('type', type)
WHERE type IN ('MANUAL', 'UNIT', 'INTEGRATION');

-- Note: We are intentionally NOT dropping the old columns in this migration to allow for safe rollback if needed.
-- DROP COLUMN statements should be executed in a separate, future migration once stability is confirmed.
