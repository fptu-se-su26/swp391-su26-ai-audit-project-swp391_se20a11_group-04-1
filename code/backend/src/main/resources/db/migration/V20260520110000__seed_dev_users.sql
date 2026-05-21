-- Migration: V20260520110000__seed_dev_users.sql
-- Date: 2026-05-20
-- Description: Add dev team members (Chi C, Hoang B, Tuan D) as user accounts
--              so that owner_id FK in requirements table accepts values 2, 3, 4.
--              Password for all = "password" (BCrypt hashed)

-- =========================================================
-- DEV TEAM MEMBERS
-- =========================================================
INSERT INTO user_accounts (id, username, email, password_hash, system_role_id, is_active, created_at, updated_at)
VALUES
    (2, 'chi_c',    'chi.c@devtrack.local',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'hoang_b',  'hoang.b@devtrack.local',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 'tuan_d',   'tuan.d@devtrack.local',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- =========================================================
-- DEV TEAM PROFILES
-- =========================================================
INSERT INTO user_profiles (user_id, full_name, bio, updated_at)
VALUES
    (2, 'Chi C',    'Dev team member', CURRENT_TIMESTAMP),
    (3, 'Hoang B',  'Dev team member', CURRENT_TIMESTAMP),
    (4, 'Tuan D',   'Dev team member', CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO NOTHING;
