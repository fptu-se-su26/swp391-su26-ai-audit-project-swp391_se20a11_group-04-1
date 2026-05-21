-- Migration: V20260520100000__seed_dev_data.sql
-- Date: 2026-05-20
-- Author: Dev Team
-- Description: Seed minimum required data for local development.
--              Inserts default system_roles, project_roles, a dev user account,
--              a dev user profile, and a default project so that the
--              hardcoded DEFAULT_PROJECT_ID=1 / DEFAULT_USER_ID=1 in
--              RequirementServiceImpl resolves FK constraints correctly.

-- =========================================================
-- SYSTEM ROLES (idempotent)
-- =========================================================
INSERT INTO system_roles (id, name, description)
VALUES
    (1, 'ADMIN',  'System administrator'),
    (2, 'USER',   'Regular user'),
    (3, 'MENTOR', 'Project mentor')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- PROJECT ROLES (idempotent)
-- =========================================================
INSERT INTO project_roles (id, name, description)
VALUES
    (1, 'LEADER',   'Project leader'),
    (2, 'MEMBER',   'Project member'),
    (3, 'TESTER',   'QA / Tester'),
    (4, 'REVIEWER', 'Code reviewer')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- DEV USER ACCOUNT  (id=1, password = "password" BCrypt)
-- =========================================================
INSERT INTO user_accounts (id, username, email, password_hash, system_role_id, is_active, created_at, updated_at)
VALUES (
    1,
    'dev_admin',
    'dev@devtrack.local',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    1,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

-- =========================================================
-- DEV USER PROFILE
-- =========================================================
INSERT INTO user_profiles (user_id, full_name, bio, updated_at)
VALUES (1, 'Dev Admin', 'Default development account', CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO NOTHING;

-- =========================================================
-- ACADEMIC CONTEXT
-- =========================================================
INSERT INTO academic_contexts (id, subject, semester, academic_year)
VALUES (1, 'SWP391', 'SU26', '2025-2026')
ON CONFLICT (subject, semester, academic_year) DO NOTHING;

-- =========================================================
-- DEFAULT PROJECT  (id=1)
-- =========================================================
INSERT INTO projects (id, name, description, type, academic_context_id, deadline, status, created_by, created_at, updated_at)
VALUES (
    1,
    'AI Audit Project',
    'Default development project for SWP391',
    'WEB_APP',
    1,
    '2026-12-31',
    'ACTIVE',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;
