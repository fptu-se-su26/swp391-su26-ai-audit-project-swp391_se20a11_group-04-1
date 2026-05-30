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
        
        -- Xóa các test case demo cũ nếu chạy lại script để tránh rác
        DELETE FROM test_cases WHERE title LIKE '[Demo E2E] %';

        -- 1. Navigation Error & Quên đăng nhập
        INSERT INTO test_cases (project_id, requirement_id, title, type, precondition, expected_result, created_by, base_url, steps_structured, script_source) 
        VALUES (v_project_id, v_req_id, '[Demo E2E] 1. Navigation & Quên Đăng Nhập', 'UI', 'Chưa login', 'Báo lỗi Custom URL', v_user_id, 'https://example.com',
            '[
              {"order": 1, "action": "goto", "path": "/dashboard", "description": "Cố truy cập Dashboard khi chưa đăng nhập"},
              {"order": 2, "action": "expect_url", "expected": "/dashboard", "description": "Kỳ vọng ở Dashboard (nhưng web tự bật về /login -> Báo lỗi khuyên Đăng nhập)"}
            ]'::jsonb, 'TEMPLATE');

        -- 2. Missing Element (Thiếu component)
        INSERT INTO test_cases (project_id, requirement_id, title, type, precondition, expected_result, created_by, base_url, steps_structured, script_source) 
        VALUES (v_project_id, v_req_id, '[Demo E2E] 2. Thiếu Component', 'UI', '', 'Fail do không thấy element', v_user_id, 'https://example.com',
            '[
              {"order": 1, "action": "goto", "path": "/", "description": "Vào trang chủ"},
              {"order": 2, "action": "expect_visible", "selector": "#btn-admin-panel", "description": "Kỳ vọng thấy nút Admin (nhưng dev quên làm)"}
            ]'::jsonb, 'TEMPLATE');

        -- 3. Wrong Text (Hiển thị sai dữ liệu)
        INSERT INTO test_cases (project_id, requirement_id, title, type, precondition, expected_result, created_by, base_url, steps_structured, script_source) 
        VALUES (v_project_id, v_req_id, '[Demo E2E] 3. Hiển thị sai dữ liệu', 'UI', '', 'Fail do sai Text', v_user_id, 'https://example.com',
            '[
              {"order": 1, "action": "goto", "path": "/", "description": "Vào trang chủ"},
              {"order": 2, "action": "expect_text", "selector": "h1", "expected": "DevTrackAI - The Best", "description": "Kỳ vọng Text dài nhưng UI chỉ hiện ngắn"}
            ]'::jsonb, 'TEMPLATE');

        -- 4. Form Validation Error
        INSERT INTO test_cases (project_id, requirement_id, title, type, precondition, expected_result, created_by, base_url, steps_structured, script_source) 
        VALUES (v_project_id, v_req_id, '[Demo E2E] 4. Lỗi Validation Form', 'UI', '', 'Fail do không thấy chữ báo lỗi', v_user_id, 'https://example.com',
            '[
              {"order": 1, "action": "goto", "path": "/register", "description": "Vào form"},
              {"order": 2, "action": "fill", "selector": "#email", "value": "", "description": "Bỏ trống email"},
              {"order": 3, "action": "click", "selector": "#btn-submit", "description": "Bấm Lưu"},
              {"order": 4, "action": "expect_visible", "selector": ".text-red-500", "description": "Kỳ vọng hiện dòng chữ đỏ báo lỗi (nhưng form cho qua luôn)"}
            ]'::jsonb, 'TEMPLATE');

        -- 5. Permission Error (Lỗi phân quyền)
        INSERT INTO test_cases (project_id, requirement_id, title, type, precondition, expected_result, created_by, base_url, steps_structured, script_source) 
        VALUES (v_project_id, v_req_id, '[Demo E2E] 5. Lỗi Phân quyền bảo mật', 'UI', 'Là User thường', 'Fail do nhìn thấy nút Xóa', v_user_id, 'https://example.com',
            '[
              {"order": 1, "action": "goto", "path": "/", "description": "Vào trang chủ"},
              {"order": 2, "action": "expect_hidden", "selector": "#btn-delete-database", "description": "Kỳ vọng không nhìn thấy nút Xóa DB (nhưng phân quyền lỏng nên vẫn thấy)"}
            ]'::jsonb, 'TEMPLATE');

        -- 6. Data Dependency & Random Macro
        INSERT INTO test_cases (project_id, requirement_id, title, type, precondition, expected_result, created_by, base_url, steps_structured, script_source) 
        VALUES (v_project_id, v_req_id, '[Demo E2E] 6. Xử lý Trùng lặp dữ liệu', 'UI', '', 'Sẽ Pass hoặc Fail nhanh do element ảo', v_user_id, 'https://example.com',
            '[
              {"order": 1, "action": "goto", "path": "/register", "description": "Vào trang đăng ký"},
              {"order": 2, "action": "fill", "selector": "#email", "value": "{{RANDOM_EMAIL}}", "description": "Hệ thống tự động thay bằng email ảo"},
              {"order": 3, "action": "fill", "selector": "#project-name", "value": "{{RANDOM_TEXT}}", "description": "Hệ thống thay bằng text ngẫu nhiên"},
              {"order": 4, "action": "click", "selector": "#btn-submit", "description": "Submit form"}
            ]'::jsonb, 'TEMPLATE');

        -- 7. Broken Flow (Luồng bị đứt)
        INSERT INTO test_cases (project_id, requirement_id, title, type, precondition, expected_result, created_by, base_url, steps_structured, script_source) 
        VALUES (v_project_id, v_req_id, '[Demo E2E] 7. Đứt gãy luồng người dùng', 'UI', '', 'Fail ở bước 3 làm đứt toàn flow', v_user_id, 'https://example.com',
            '[
              {"order": 1, "action": "goto", "path": "/login", "description": "Login"},
              {"order": 2, "action": "click", "selector": "#btn-login", "description": "Click Login"},
              {"order": 3, "action": "click", "selector": "#btn-create-task", "description": "Tạo Task (Lỗi: Nút này chưa code xong)"},
              {"order": 4, "action": "fill", "selector": "#task-name", "value": "New Task", "description": "Nhập tên task (Step này không bao giờ chạy tới)"},
              {"order": 5, "action": "click", "selector": "#btn-logout", "description": "Logout (Không chạy tới)"}
            ]'::jsonb, 'TEMPLATE');

    END IF;
END $$;
