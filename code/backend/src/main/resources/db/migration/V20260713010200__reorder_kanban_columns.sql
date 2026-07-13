-- Migration: V20260713010200__reorder_kanban_columns.sql
-- Description: Reorder default Kanban columns:
-- IN_REVIEW: 2
-- DONE: 3
-- NEEDS_CHANGES: 4
-- BLOCKED: 5

UPDATE kanban_columns SET column_order = 2 WHERE status_key = 'IN_REVIEW';
UPDATE kanban_columns SET column_order = 3 WHERE status_key = 'DONE';
UPDATE kanban_columns SET column_order = 4 WHERE status_key = 'NEEDS_CHANGES';
UPDATE kanban_columns SET column_order = 5 WHERE status_key = 'BLOCKED';
