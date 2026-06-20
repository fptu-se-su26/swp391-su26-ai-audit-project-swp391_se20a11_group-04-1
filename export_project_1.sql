-- ================================================================
-- EXPORT DỮ LIỆU PROJECT ID = 1
-- Chạy file này trên máy khác để seed đúng dữ liệu demo
-- Thứ tự INSERT đúng theo FK dependency
-- ================================================================

-- Tắt trigger và constraint check tạm thời (an toàn hơn khi import)
SET session_replication_role = replica;

-- ================================================================
-- BƯỚC 1: LẤY DỮ LIỆU (chạy từng SELECT để copy ra)
-- Hoặc dùng phần INSERT bên dưới nếu đã có data sẵn
-- ================================================================

-- ---- [1] PROJECT ----
SELECT
    id,
    name,
    description,
    type,
    academic_context_id,
    start_date,
    deadline,
    status,
    color,
    avatar_url,
    created_by,
    created_at,
    updated_at
FROM projects
WHERE id = 1;

-- ---- [2] PROJECT MEMBERS ----
SELECT
    pm.id,
    pm.project_id,
    pm.user_id,
    pm.project_role_id,
    pm.joined_at,
    pm.invited_by,
    ua.username,
    ua.email,
    pr.name AS role_name
FROM project_members pm
JOIN user_accounts ua ON ua.id = pm.user_id
JOIN project_roles pr ON pr.id = pm.project_role_id
WHERE pm.project_id = 1;

-- ---- [3] REQUIREMENTS ----
SELECT
    r.id,
    r.project_id,
    r.req_code,
    r.project_sub_id,
    r.title,
    r.description,
    r.type,
    r.priority,
    r.status,
    r.acceptance_criteria,
    r.evidence_required,
    r.req_order,
    r.is_deleted,
    r.ai_generated,
    r.created_by,
    r.created_at,
    r.updated_at
FROM requirements r
WHERE r.project_id = 1
  AND r.is_deleted = FALSE
ORDER BY r.project_sub_id;

-- ---- [4] REQUIREMENT TAGS ----
SELECT rt.*
FROM requirement_tags rt
JOIN requirements r ON r.id = rt.requirement_id
WHERE r.project_id = 1
  AND r.is_deleted = FALSE;

-- ---- [5] USE CASES ----
SELECT
    uc.id,
    uc.project_id,
    uc.requirement_id,
    uc.code,
    uc.project_sub_id,
    uc.name,
    uc.status,
    uc.version,
    uc.precondition,
    uc.postcondition,
    uc.main_flow,
    uc.alternative_flow,
    uc.includes_list,
    uc.extends_list,
    uc.completeness_score,
    uc.show_in_diagram,
    uc.added_from_diagram,
    uc.ai_generated,
    uc.source_generation_id,
    uc.req_version_hash,
    uc.is_deleted,
    uc.created_by,
    uc.created_at,
    uc.updated_at
FROM use_cases uc
WHERE uc.project_id = 1
  AND uc.is_deleted = FALSE
ORDER BY uc.project_sub_id;

-- ---- [6] USE CASE ACTORS (bảng use_case_actors) ----
SELECT uca.*
FROM use_case_actors uca
JOIN use_cases uc ON uc.id = uca.use_case_id
WHERE uc.project_id = 1
  AND uc.is_deleted = FALSE;

-- ---- [7] PROJECT ACTORS (cho diagram) ----
SELECT *
FROM project_actors
WHERE project_id = 1
  AND is_deleted = FALSE;

-- ---- [8] PROJECT DIAGRAM (layout + relations) ----
SELECT
    id,
    project_id,
    layout_data,
    -- image_base64 thường rất lớn, bỏ qua khi export
    -- image_base64,
    updated_at,
    created_at
FROM project_diagrams
WHERE project_id = 1;

-- ---- [9] SPRINTS ----
SELECT *
FROM sprints
WHERE project_id = 1
ORDER BY start_date;

-- ---- [10] TASKS ----
SELECT
    t.id,
    t.project_id,
    t.requirement_id,
    t.sprint_id,
    t.task_code,
    t.project_sub_id,
    t.title,
    t.description,
    t.type,
    t.primary_assignee_id,
    t.priority,
    t.deadline,
    t.start_date,
    t.estimated_hours,
    t.status,
    t.blocked_reason,
    t.created_by,
    t.created_at,
    t.updated_at
FROM tasks t
WHERE t.project_id = 1
ORDER BY t.project_sub_id;

-- ---- [11] TEST CASES ----
SELECT
    tc.id,
    tc.project_id,
    tc.requirement_id,
    tc.tc_code,
    tc.project_sub_id,
    tc.title,
    tc.type,
    tc.precondition,
    tc.expected_result,
    tc.status,
    tc.is_deleted,
    tc.created_by,
    tc.created_at,
    tc.updated_at
FROM test_cases tc
WHERE tc.project_id = 1
  AND tc.is_deleted = FALSE
ORDER BY tc.project_sub_id;

-- ---- [12] EVIDENCE ----
SELECT
    e.id,
    e.project_id,
    e.uploaded_by,
    e.type,
    e.title,
    e.description,
    e.file_url,
    e.external_url,
    e.metadata,
    e.status,
    e.reviewed_by,
    e.reviewed_at,
    e.created_at
FROM evidence e
WHERE e.project_id = 1;

-- ---- [13] EVIDENCE LINKS ----
SELECT el.*
FROM evidence_links el
JOIN evidence e ON e.id = el.evidence_id
WHERE e.project_id = 1;

-- ================================================================
-- PHẦN GENERATE INSERT STATEMENTS
-- Chạy query này để sinh câu INSERT tự động
-- (dùng khi muốn copy data sang máy khác)
-- ================================================================

-- Sinh INSERT cho requirements của project 1:
SELECT
    'INSERT INTO requirements (id, project_id, req_code, project_sub_id, title, description, type, priority, status, acceptance_criteria, evidence_required, req_order, is_deleted, created_by, created_at, updated_at) VALUES ('
    || id || ', '
    || project_id || ', '
    || COALESCE('''' || req_code || '''', 'NULL') || ', '
    || COALESCE(project_sub_id::TEXT, 'NULL') || ', '
    || '''' || REPLACE(title, '''', '''''') || ''', '
    || COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', '
    || '''' || type || '''::requirement_type_enum, '
    || '''' || priority || '''::priority_enum, '
    || '''' || status || '''::requirement_status_enum, '
    || '''' || REPLACE(acceptance_criteria::TEXT, '''', '''''') || '''::jsonb, '
    || evidence_required || ', '
    || COALESCE(req_order::TEXT, 'NULL') || ', '
    || is_deleted || ', '
    || created_by || ', '
    || '''' || created_at || ''', '
    || '''' || updated_at || ''''
    || ') ON CONFLICT (id) DO NOTHING;'
FROM requirements
WHERE project_id = 1
  AND is_deleted = FALSE
ORDER BY id;

-- Sinh INSERT cho use_cases của project 1:
SELECT
    'INSERT INTO use_cases (id, project_id, requirement_id, code, project_sub_id, name, status, version, precondition, postcondition, main_flow, alternative_flow, includes_list, extends_list, completeness_score, show_in_diagram, added_from_diagram, ai_generated, is_deleted, req_version_hash, created_by, created_at, updated_at) VALUES ('
    || id || ', '
    || project_id || ', '
    || COALESCE(requirement_id::TEXT, 'NULL') || ', '
    || COALESCE('''' || code || '''', 'NULL') || ', '
    || COALESCE(project_sub_id::TEXT, 'NULL') || ', '
    || '''' || REPLACE(name, '''', '''''') || ''', '
    || COALESCE('''' || status || '''', 'NULL') || ', '
    || COALESCE('''' || version || '''', 'NULL') || ', '
    || COALESCE('''' || REPLACE(precondition, '''', '''''') || '''', 'NULL') || ', '
    || COALESCE('''' || REPLACE(postcondition, '''', '''''') || '''', 'NULL') || ', '
    || '''' || REPLACE(main_flow::TEXT, '''', '''''') || '''::jsonb, '
    || COALESCE('''' || REPLACE(alternative_flow::TEXT, '''', '''''') || '''::jsonb', 'NULL') || ', '
    || COALESCE('''' || REPLACE(includes_list::TEXT, '''', '''''') || '''::jsonb', 'NULL') || ', '
    || COALESCE('''' || REPLACE(extends_list::TEXT, '''', '''''') || '''::jsonb', 'NULL') || ', '
    || COALESCE(completeness_score::TEXT, '0') || ', '
    || COALESCE(show_in_diagram::TEXT, 'TRUE') || ', '
    || COALESCE(added_from_diagram::TEXT, 'FALSE') || ', '
    || COALESCE(ai_generated::TEXT, 'FALSE') || ', '
    || is_deleted || ', '
    || COALESCE('''' || req_version_hash || '''', 'NULL') || ', '
    || created_by || ', '
    || '''' || created_at || ''', '
    || '''' || updated_at || ''''
    || ') ON CONFLICT (id) DO NOTHING;'
FROM use_cases
WHERE project_id = 1
  AND is_deleted = FALSE
ORDER BY id;

-- Sinh INSERT cho project_actors:
SELECT
    'INSERT INTO project_actors (id, project_id, name, description, is_deleted, created_at, updated_at) VALUES ('
    || id || ', '
    || project_id || ', '
    || '''' || REPLACE(name, '''', '''''') || ''', '
    || COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', '
    || is_deleted || ', '
    || '''' || created_at || ''', '
    || '''' || updated_at || ''''
    || ') ON CONFLICT (id) DO NOTHING;'
FROM project_actors
WHERE project_id = 1
  AND is_deleted = FALSE;

-- Sinh INSERT cho project_diagrams (không lấy image_base64 vì quá lớn):
SELECT
    'INSERT INTO project_diagrams (id, project_id, layout_data, updated_at, created_at) VALUES ('
    || id || ', '
    || project_id || ', '
    || COALESCE('''' || REPLACE(layout_data::TEXT, '''', '''''') || '''::jsonb', 'NULL') || ', '
    || COALESCE('''' || updated_at || '''', 'NULL') || ', '
    || COALESCE('''' || created_at || '''', 'NULL')
    || ') ON CONFLICT (project_id) DO UPDATE SET layout_data = EXCLUDED.layout_data, updated_at = EXCLUDED.updated_at;'
FROM project_diagrams
WHERE project_id = 1;

-- ================================================================
-- SAU KHI IMPORT XONG: reset sequence để tránh ID conflict
-- ================================================================

-- SELECT setval('requirements_id_seq', (SELECT MAX(id) FROM requirements));
-- SELECT setval('use_cases_id_seq', (SELECT MAX(id) FROM use_cases));
-- SELECT setval('project_actors_id_seq', (SELECT MAX(id) FROM project_actors));
-- SELECT setval('tasks_id_seq', (SELECT MAX(id) FROM tasks));
-- SELECT setval('test_cases_id_seq', (SELECT MAX(id) FROM test_cases));

-- Bật lại constraint
SET session_replication_role = DEFAULT;
