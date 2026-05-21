-- Migration: V20260522000000__fix_dev_users_system_role.sql
-- Date: 2026-05-22
-- Description: Fix dev seed users (chi_c, hoang_b, tuan_d) that were incorrectly
--              assigned system_role_id = 2 (hardcoded).
--              This migration corrects them to the proper 'USER' role by
--              looking up the id dynamically from the system_roles table.

-- =========================================================
-- FIX: Assign correct USER system role to dev team members
-- =========================================================
UPDATE user_accounts
SET system_role_id = (SELECT id FROM system_roles WHERE name = 'USER')
WHERE username IN ('chi_c', 'hoang_b', 'tuan_d')
  AND system_role_id != (SELECT id FROM system_roles WHERE name = 'USER');
