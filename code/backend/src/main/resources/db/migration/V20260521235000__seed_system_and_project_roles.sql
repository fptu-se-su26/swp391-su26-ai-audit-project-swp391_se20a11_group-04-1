-- Migration: V20260521235000__seed_system_and_project_roles.sql
-- Date: 2026-05-21
-- Author: Antigravity
-- Description: Seed system_roles and project_roles with initial data required for user registration and project management

-- =========================================================
-- SEED SYSTEM ROLES
-- =========================================================
-- These roles are required for user registration (default role = 'USER')
-- Without these rows, registration fails with 500 error because
-- systemRoleRepository.findByName("USER") returns empty.

INSERT INTO system_roles (name, description)
VALUES
    ('USER', 'Default role for registered users'),
    ('ADMIN', 'System administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- SEED PROJECT ROLES
-- =========================================================
-- These roles are assigned per-project when members join

INSERT INTO project_roles (name, description)
VALUES
    ('LEADER', 'Project leader with full project management permissions'),
    ('MEMBER', 'Team member with task and evidence management permissions'),
    ('MENTOR', 'Mentor/Supervisor with read-only access to project data')
ON CONFLICT (name) DO NOTHING;
