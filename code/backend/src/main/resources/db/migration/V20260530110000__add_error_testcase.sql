DO $$
DECLARE
    v_project_id BIGINT;
    v_req_id BIGINT;
    v_user_id BIGINT;
BEGIN
    -- Tìm ID hợp lệ đang có trong Database để gán khoá ngoại
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    SELECT id INTO v_req_id FROM requirements LIMIT 1;
    SELECT id INTO v_user_id FROM user_accounts LIMIT 1;

    IF v_project_id IS NOT NULL AND v_req_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        INSERT INTO test_cases (
            project_id, requirement_id, title, type, precondition, expected_result, created_by,
            base_url, steps_structured, script_source
        ) VALUES (
            v_project_id, v_req_id, 'Test Fail-Fast, Random Email & Quên Đăng nhập (Auto Seed)', 'UI', 'Chưa đăng nhập gì cả', 'Sẽ báo lỗi Fail-fast và Lỗi URL do chưa đăng nhập', v_user_id,
            'https://example.com',
            '[
              {"order": 1, "action": "goto", "path": "/", "description": "Vào trang chủ"},
              {"order": 2, "action": "fill", "selector": "#field-email-sai-hoan-toan", "value": "{{RANDOM_EMAIL}}", "description": "Cố tình điền email ngẫu nhiên vào một DOM Selector không tồn tại (Sẽ Fail-fast 5s)"},
              {"order": 3, "action": "expect_url", "expected": "/dashboard", "description": "Kiểm tra URL (Sẽ báo cảnh báo Quên đăng nhập nếu chạy tới đây)"}
            ]'::jsonb,
            'TEMPLATE'
        );
    END IF;
END $$;
