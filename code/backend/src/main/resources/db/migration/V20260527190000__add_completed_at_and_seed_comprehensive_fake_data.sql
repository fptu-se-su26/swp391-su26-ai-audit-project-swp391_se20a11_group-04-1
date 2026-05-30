-- Migration: V20260527190000__add_completed_at_and_seed_comprehensive_fake_data.sql
-- Date: 2026-05-27
-- Author: AI_Assistant
-- Description: Add completed_at column to tasks table and seed comprehensive fake data for 1 LEADER to test all Daily/Weekly view cases.

-- =========================================================
-- 0. SCHEMA UPDATES
-- =========================================================
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP;

-- =========================================================
-- 1. SEED USER (1 LEADER)
-- =========================================================
-- Password hash = bcrypt("Password123!") - dùng cho test
INSERT INTO user_accounts (username, email, password_hash, system_role_id, is_active)
SELECT 'test_leader', 'leader@devtrack.test', '$2a$10$f6p9UQH39dN3JC0fbrQiUeVZhFX.p8br/r7ke3nrcH4h1efPLkBjG', sr.id, TRUE
FROM system_roles sr WHERE sr.name = 'USER'
  AND NOT EXISTS (SELECT 1 FROM user_accounts WHERE email = 'leader@devtrack.test');

INSERT INTO user_accounts (username, email, password_hash, system_role_id, is_active)
SELECT u.username, u.email, '$2a$10$f6p9UQH39dN3JC0fbrQiUeVZhFX.p8br/r7ke3nrcH4h1efPLkBjG', sr.id, TRUE
FROM system_roles sr
CROSS JOIN (VALUES
    ('test_member1', 'member1@devtrack.test'),
    ('test_member2', 'member2@devtrack.test'),
    ('test_member3', 'member3@devtrack.test'),
    ('test_member4', 'member4@devtrack.test')
) AS u(username, email)
WHERE sr.name = 'USER'
  AND NOT EXISTS (SELECT 1 FROM user_accounts ua WHERE ua.email = u.email);

INSERT INTO user_profiles (user_id, full_name, bio)
SELECT ua.id, 'Super Leader', 'Project Manager & Tech Lead'
FROM user_accounts ua WHERE ua.email = 'leader@devtrack.test'
  AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = ua.id);

INSERT INTO user_profiles (user_id, full_name, bio)
SELECT ua.id, 'Test Member ' || SUBSTRING(ua.username FROM 12), 'Project Member'
FROM user_accounts ua WHERE ua.email LIKE 'member%@devtrack.test'
  AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = ua.id);

-- =========================================================
-- 2. SEED PROJECT
-- =========================================================
INSERT INTO projects (name, description, type, start_date, deadline, status, color, created_by)
SELECT 'DevTrack Alpha Test', 'Dự án test đặc biệt với toàn bộ dữ liệu mẫu cho Leader', 'WEB_APP', '2026-05-01', '2026-07-31', 'ACTIVE', '#1E3A5F', ua.id
FROM user_accounts ua WHERE ua.email = 'leader@devtrack.test'
  AND NOT EXISTS (SELECT 1 FROM projects WHERE name = 'DevTrack Alpha Test');

-- =========================================================
-- 3. SEED PROJECT MEMBER (LEADER AND MEMBERS)
-- =========================================================
INSERT INTO project_members (project_id, user_id, project_role_id, invited_by)
SELECT p.id, ua.id, pr.id, ua.id
FROM projects p
JOIN user_accounts ua ON ua.email = 'leader@devtrack.test'
JOIN project_roles pr ON pr.name = 'LEADER'
WHERE p.name = 'DevTrack Alpha Test'
  AND NOT EXISTS (SELECT 1 FROM project_members pm2 WHERE pm2.project_id = p.id AND pm2.user_id = ua.id);

INSERT INTO project_members (project_id, user_id, project_role_id, invited_by)
SELECT p.id, ua.id, pr.id, leader.id
FROM projects p
JOIN user_accounts ua ON ua.email LIKE 'member%@devtrack.test'
JOIN user_accounts leader ON leader.email = 'leader@devtrack.test'
JOIN project_roles pr ON pr.name = 'MEMBER'
WHERE p.name = 'DevTrack Alpha Test'
  AND NOT EXISTS (SELECT 1 FROM project_members pm2 WHERE pm2.project_id = p.id AND pm2.user_id = ua.id);

-- =========================================================
-- 4. SEED SPRINTS
-- =========================================================
INSERT INTO sprints (project_id, name, goal, start_date, end_date, status)
SELECT p.id, s.name, s.goal, s.start_date::DATE, s.end_date::DATE, s.status::sprint_status_enum
FROM projects p
CROSS JOIN (VALUES
    ('Sprint 1', 'Hoàn thành base', '2026-05-01', '2026-05-15', 'COMPLETED'),
    ('Sprint 2', 'Tập trung tính năng Core', '2026-05-16', '2026-05-31', 'ACTIVE')
) AS s(name, goal, start_date, end_date, status)
WHERE p.name = 'DevTrack Alpha Test'
  AND NOT EXISTS (SELECT 1 FROM sprints sp WHERE sp.project_id = p.id AND sp.name = s.name);

-- =========================================================
-- 5. SEED 10 REQUIREMENTS
-- =========================================================
INSERT INTO requirements (project_id, title, description, type, priority, acceptance_criteria, owner_id, status, evidence_required, req_order, created_by, req_code, project_sub_id)
SELECT p.id, r.title, r.description, r.type::requirement_type_enum, r.priority::priority_enum, r.acceptance_criteria::jsonb, ua.id, r.status::requirement_status_enum, TRUE, r.req_order, ua.id, r.req_code, r.req_order
FROM projects p
JOIN user_accounts ua ON ua.email = 'leader@devtrack.test'
CROSS JOIN (VALUES
    (1, 'REQ-01', 'Authentication', 'Đăng nhập đăng ký', 'FUNCTIONAL', 'CRITICAL', '["A","B"]', 'DONE'),
    (2, 'REQ-02', 'Authorization', 'Phân quyền', 'FUNCTIONAL', 'HIGH', '["A","B"]', 'DONE'),
    (3, 'REQ-03', 'Project CRUD', 'Quản lý dự án', 'FUNCTIONAL', 'HIGH', '["A","B"]', 'IN_PROGRESS'),
    (4, 'REQ-04', 'Task CRUD', 'Quản lý task', 'FUNCTIONAL', 'HIGH', '["A","B"]', 'IN_PROGRESS'),
    (5, 'REQ-05', 'Kanban Board', 'Kéo thả task', 'FUNCTIONAL', 'HIGH', '["A","B"]', 'IN_PROGRESS'),
    (6, 'REQ-06', 'Daily View', 'Xem lịch ngày', 'FUNCTIONAL', 'MEDIUM', '["A","B"]', 'DRAFT'),
    (7, 'REQ-07', 'Weekly View', 'Xem lịch tuần', 'FUNCTIONAL', 'MEDIUM', '["A","B"]', 'DRAFT'),
    (8, 'REQ-08', 'Sprint Planning', 'Lên kế hoạch sprint', 'FUNCTIONAL', 'MEDIUM', '["A","B"]', 'DRAFT'),
    (9, 'REQ-09', 'Evidence Vault', 'Quản lý bằng chứng', 'FUNCTIONAL', 'LOW', '["A","B"]', 'DRAFT'),
    (10,'REQ-10', 'AI Insights', 'Gợi ý AI', 'FUNCTIONAL', 'LOW', '["A","B"]', 'DRAFT')
) AS r(req_order, req_code, title, description, type, priority, acceptance_criteria, status)
WHERE p.name = 'DevTrack Alpha Test'
  AND NOT EXISTS (SELECT 1 FROM requirements rq WHERE rq.project_id = p.id AND rq.req_code = r.req_code);

-- =========================================================
-- 6. SEED 10 USE CASES
-- =========================================================
INSERT INTO use_cases (requirement_id, project_id, name, precondition, postcondition, main_flow, alternative_flow, created_by, project_sub_id)
SELECT req.id, req.project_id, uc.name, uc.precondition, uc.postcondition, uc.main_flow::jsonb, uc.alternative_flow::jsonb, ua.id, uc.uc_sub_id
FROM requirements req
JOIN projects p ON p.id = req.project_id
JOIN user_accounts ua ON ua.email = 'leader@devtrack.test'
CROSS JOIN (VALUES
    ('REQ-01', 1, 'UC-01 Login', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-02', 2, 'UC-02 RBAC', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-03', 3, 'UC-03 Create Project', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-04', 4, 'UC-04 Create Task', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-05', 5, 'UC-05 Drag Task', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-06', 6, 'UC-06 View Daily', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-07', 7, 'UC-07 View Weekly', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-08', 8, 'UC-08 Start Sprint', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-09', 9, 'UC-09 Upload File', 'None', 'Success', '["A"]', '["B"]'),
    ('REQ-10', 10,'UC-10 Ask AI', 'None', 'Success', '["A"]', '["B"]')
) AS uc(req_code, uc_sub_id, name, precondition, postcondition, main_flow, alternative_flow)
WHERE req.req_code = uc.req_code AND p.name = 'DevTrack Alpha Test'
  AND NOT EXISTS (SELECT 1 FROM use_cases uc2 WHERE uc2.requirement_id = req.id AND uc2.name = uc.name);

-- =========================================================
-- 7. SEED 20 TASKS (TESTING ALL SCENARIOS FOR 2026-05-27)
-- =========================================================
INSERT INTO tasks (
    project_id, requirement_id, sprint_id, title, description, type, primary_assignee_id,
    priority, deadline, estimated_hours, status, blocked_reason, created_by, task_code, project_sub_id,
    updated_at, completed_at
)
SELECT
    p.id, req.id, sp.id, t.title, t.description, t.type::task_type_enum, ua.id,
    t.priority::priority_enum, t.deadline::DATE, t.estimated_hours, t.status::task_status_enum,
    t.blocked_reason, ua.id, t.task_code, t.task_sub_id, t.updated_at::TIMESTAMP, t.completed_at::TIMESTAMP
FROM projects p
JOIN user_accounts ua ON ua.email = 'leader@devtrack.test'
CROSS JOIN (VALUES
    -- TRƯỜNG HỢP 1: CÁC TASK ĐẾN HẠN HÔM NAY (2026-05-27)
    (1, 'TASK-01', 'REQ-01', 'Sprint 2', 'Hôm nay - Todo', 'Task này đáo hạn hôm nay, đang ở Todo', 'DEVELOPMENT', 'HIGH', '2026-05-27', 4.0, 'TODO', NULL, '2026-05-26 10:00:00', NULL),
    (2, 'TASK-02', 'REQ-02', 'Sprint 2', 'Hôm nay - In Progress', 'Task này đáo hạn hôm nay, đang làm', 'DEVELOPMENT', 'HIGH', '2026-05-27', 4.0, 'IN_PROGRESS', NULL, '2026-05-26 10:00:00', NULL),
    (3, 'TASK-03', 'REQ-03', 'Sprint 2', 'Hôm nay - In Review', 'Task này đáo hạn hôm nay, chờ review', 'DEVELOPMENT', 'HIGH', '2026-05-27', 4.0, 'IN_REVIEW', NULL, '2026-05-26 10:00:00', NULL),
    (4, 'TASK-04', 'REQ-04', 'Sprint 2', 'Hôm nay - Blocked', 'Task này đáo hạn hôm nay, đang bị kẹt', 'DEVELOPMENT', 'CRITICAL', '2026-05-27', 4.0, 'BLOCKED', 'Thiếu API', '2026-05-26 10:00:00', NULL),
    (5, 'TASK-05', 'REQ-05', 'Sprint 2', 'Hôm nay - Done', 'Task hoàn thành hôm nay', 'DEVELOPMENT', 'HIGH', '2026-05-27', 4.0, 'DONE', NULL, '2026-05-27 10:00:00', '2026-05-27 10:00:00'),

    -- TRƯỜNG HỢP 2: CÁC TASK ĐÃ QUÁ HẠN (OVERDUE - Deadline trong quá khứ)
    (6, 'TASK-06', 'REQ-06', 'Sprint 2', 'Quá hạn 1 ngày - Todo', 'Deadline là hôm qua', 'DEVELOPMENT', 'HIGH', '2026-05-26', 4.0, 'TODO', NULL, '2026-05-25 10:00:00', NULL),
    (7, 'TASK-07', 'REQ-07', 'Sprint 2', 'Quá hạn 2 ngày - In Progress', 'Deadline 2 ngày trước', 'DEVELOPMENT', 'HIGH', '2026-05-25', 4.0, 'IN_PROGRESS', NULL, '2026-05-24 10:00:00', NULL),
    (8, 'TASK-08', 'REQ-08', 'Sprint 2', 'Quá hạn 1 tuần - In Review', 'Deadline rất lâu rồi', 'DEVELOPMENT', 'HIGH', '2026-05-20', 4.0, 'IN_REVIEW', NULL, '2026-05-19 10:00:00', NULL),
    (9, 'TASK-09', 'REQ-09', 'Sprint 2', 'Quá hạn & Blocked', 'Deadline hôm qua nhưng bị kẹt', 'DEVELOPMENT', 'CRITICAL', '2026-05-26', 4.0, 'BLOCKED', 'Chờ design', '2026-05-25 10:00:00', NULL),
    (10,'TASK-10', 'REQ-10', 'Sprint 2', 'Đã hoàn thành hôm qua', 'Task done từ hôm qua', 'DEVELOPMENT', 'HIGH', '2026-05-25', 4.0, 'DONE', NULL, '2026-05-26 10:00:00', '2026-05-26 10:00:00'),

    -- TRƯỜNG HỢP 3: CÁC TASK TRONG TUẦN NÀY (Nhưng tương lai)
    (11, 'TASK-11', 'REQ-01', 'Sprint 2', 'Ngày mai - Todo', 'Deadline ngày mai (28/05)', 'DEVELOPMENT', 'MEDIUM', '2026-05-28', 4.0, 'TODO', NULL, '2026-05-26 10:00:00', NULL),
    (12, 'TASK-12', 'REQ-02', 'Sprint 2', 'Thứ 6 - In Progress', 'Deadline thứ 6 (29/05)', 'DEVELOPMENT', 'MEDIUM', '2026-05-29', 4.0, 'IN_PROGRESS', NULL, '2026-05-26 10:00:00', NULL),
    (13, 'TASK-13', 'REQ-03', 'Sprint 2', 'Thứ 7 - In Review', 'Deadline thứ 7 (30/05)', 'DEVELOPMENT', 'MEDIUM', '2026-05-30', 4.0, 'IN_REVIEW', NULL, '2026-05-26 10:00:00', NULL),
    (14, 'TASK-14', 'REQ-04', 'Sprint 2', 'Chủ nhật - Blocked', 'Deadline CN (31/05)', 'DEVELOPMENT', 'CRITICAL', '2026-05-31', 4.0, 'BLOCKED', 'Chờ data', '2026-05-26 10:00:00', NULL),
    (15, 'TASK-15', 'REQ-05', 'Sprint 2', 'Xong sớm - Deadline ngày mai', 'Deadline ngày mai nhưng đã làm xong hôm nay', 'DEVELOPMENT', 'MEDIUM', '2026-05-28', 4.0, 'DONE', NULL, '2026-05-27 14:00:00', '2026-05-27 14:00:00'),

    -- TRƯỜNG HỢP 4: CÁC TASK TUẦN SAU HOẶC KHÔNG CÓ HẠN
    (16, 'TASK-16', 'REQ-06', 'Sprint 2', 'Tuần sau - Todo', 'Deadline rơi vào tuần kế tiếp (05/06)', 'DEVELOPMENT', 'LOW', '2026-06-05', 8.0, 'TODO', NULL, '2026-05-26 10:00:00', NULL),
    (17, 'TASK-17', 'REQ-07', 'Sprint 2', 'Tháng sau - In Progress', 'Deadline tháng sau (10/06)', 'DEVELOPMENT', 'LOW', '2026-06-10', 8.0, 'IN_PROGRESS', NULL, '2026-05-26 10:00:00', NULL),
    (18, 'TASK-18', 'REQ-08', 'Sprint 2', 'Không có deadline', 'Task không setup deadline', 'DEVELOPMENT', 'LOW', NULL, 2.0, 'TODO', NULL, '2026-05-26 10:00:00', NULL),
    (19, 'TASK-19', 'REQ-09', 'Sprint 2', 'Không deadline & Blocked', 'Kẹt vô thời hạn', 'DEVELOPMENT', 'CRITICAL', NULL, 2.0, 'BLOCKED', 'Lỗi môi trường', '2026-05-26 10:00:00', NULL),
    (20, 'TASK-20', 'REQ-10', 'Sprint 2', 'Xong sớm - Deadline tuần sau', 'Deadline tuần sau nhưng nay đã done', 'DEVELOPMENT', 'LOW', '2026-06-01', 8.0, 'DONE', NULL, '2026-05-27 16:00:00', '2026-05-27 16:00:00')
) AS t(task_sub_id, task_code, req_code, sprint_name, title, description, type, priority, deadline, estimated_hours, status, blocked_reason, updated_at, completed_at)
JOIN requirements req ON req.req_code = t.req_code AND req.project_id = p.id
JOIN sprints sp ON sp.name = t.sprint_name AND sp.project_id = p.id
WHERE p.name = 'DevTrack Alpha Test'
  AND NOT EXISTS (SELECT 1 FROM tasks tk WHERE tk.project_id = p.id AND tk.task_code = t.task_code);

-- =========================================================
-- 8. SEED TASK ASSIGNEES
-- =========================================================
INSERT INTO task_assignees (task_id, user_id)
SELECT t.id, t.primary_assignee_id
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE p.name = 'DevTrack Alpha Test'
  AND t.primary_assignee_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = t.primary_assignee_id);
