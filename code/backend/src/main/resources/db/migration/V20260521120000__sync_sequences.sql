-- Migration: V20260521120000__sync_sequences.sql
-- Description: Sync Identity Sequences after explicit ID inserts from seed data

SELECT setval(pg_get_serial_sequence('system_roles', 'id'), COALESCE((SELECT MAX(id) FROM system_roles), 1));
SELECT setval(pg_get_serial_sequence('project_roles', 'id'), COALESCE((SELECT MAX(id) FROM project_roles), 1));
SELECT setval(pg_get_serial_sequence('user_accounts', 'id'), COALESCE((SELECT MAX(id) FROM user_accounts), 1));
SELECT setval(pg_get_serial_sequence('academic_contexts', 'id'), COALESCE((SELECT MAX(id) FROM academic_contexts), 1));
SELECT setval(pg_get_serial_sequence('projects', 'id'), COALESCE((SELECT MAX(id) FROM projects), 1));
