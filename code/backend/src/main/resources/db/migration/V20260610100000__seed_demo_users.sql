-- Migration: V20260610100000__seed_demo_users.sql
-- Date: 2026-06-10
-- Author: Antigravity
-- Description: Seed admin and demo users

-- Seed demo admin user (password: Admin@123)
-- BCrypt hash of "Admin@123"
INSERT INTO user_accounts (username, email, password_hash, system_role_id, is_active)
SELECT 
  'admin',
  'admin@devtrack.local',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCzY5nqWVDKG0WxKZ4bQhGK',
  (SELECT id FROM system_roles WHERE name = 'ADMIN'),
  true
WHERE NOT EXISTS (SELECT 1 FROM user_accounts WHERE username = 'admin');

INSERT INTO user_profiles (user_id, full_name)
SELECT id, 'System Admin'
FROM user_accounts 
WHERE username = 'admin'
AND NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = (SELECT id FROM user_accounts WHERE username = 'admin'));

-- Seed demo regular user (password: User@123)
-- BCrypt hash of "User@123"
INSERT INTO user_accounts (username, email, password_hash, system_role_id, is_active)
SELECT 
  'demo',
  'demo@devtrack.local',
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  (SELECT id FROM system_roles WHERE name = 'USER'),
  true
WHERE NOT EXISTS (SELECT 1 FROM user_accounts WHERE username = 'demo');

INSERT INTO user_profiles (user_id, full_name)
SELECT id, 'Demo User'
FROM user_accounts 
WHERE username = 'demo'
AND NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = (SELECT id FROM user_accounts WHERE username = 'demo'));
