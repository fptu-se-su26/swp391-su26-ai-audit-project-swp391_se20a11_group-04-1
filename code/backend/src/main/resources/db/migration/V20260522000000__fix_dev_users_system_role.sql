-- Migration: V20260522000000__fix_dev_users_system_role.sql
-- Date: 2026-05-22
-- Description: Fix user_accounts that were incorrectly seeded with a hardcoded
--              system_role_id that does not correspond to the 'USER' role.
--              This migration corrects all regular user accounts by dynamically
--              looking up the correct 'USER' role id from the system_roles table.
--              No usernames or IDs are hardcoded — purely relationship-driven.

-- =========================================================
-- FIX: Re-assign all regular user accounts to the correct USER role
--      Excludes accounts that are legitimately ADMIN or MENTOR
-- =========================================================
UPDATE user_accounts
SET system_role_id = (SELECT id FROM system_roles WHERE name = 'USER')
WHERE system_role_id NOT IN (
    SELECT id FROM system_roles WHERE name IN ('ADMIN', 'MENTOR')
)
AND system_role_id != (SELECT id FROM system_roles WHERE name = 'USER');
