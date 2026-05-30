DO $$
DECLARE
    v_project_id BIGINT;
    v_req_id BIGINT;
    v_user_id BIGINT;
BEGIN
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    SELECT id INTO v_req_id FROM requirements LIMIT 1;
    SELECT id INTO v_user_id FROM user_accounts LIMIT 1;

    IF v_project_id IS NOT NULL AND v_req_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        
        INSERT INTO test_cases (project_id, requirement_id, title, type, precondition, expected_result, created_by, base_url, steps_structured, script_source) 
        VALUES (v_project_id, v_req_id, '[Demo E2E] 8. Thực hành Lệnh Expect Text', 'UI', 'Truy cập trang đăng nhập local', 'Pass nếu hệ thống đọc được chính xác dòng chữ Welcome Back trên UI', v_user_id, 'http://localhost:5173',
            '[
              {"order": 1, "action": "goto", "path": "/login", "description": "Vào trang đăng nhập DevTrackAI"},
              {"order": 2, "action": "expect_text", "selector": "h1", "expected": "Welcome Back", "description": "Đọc text của thẻ h1 trên UI xem có đúng là Welcome Back không"}
            ]'::jsonb, 'TEMPLATE');

    END IF;
END $$;
