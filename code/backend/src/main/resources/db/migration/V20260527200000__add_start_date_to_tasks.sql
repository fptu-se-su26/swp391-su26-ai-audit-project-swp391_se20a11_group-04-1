-- Migration: V20260527200000__add_start_date_to_tasks.sql
-- Description: Add start_date to tasks and seed multi-day data

-- 1. Add start_date column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;

-- 2. Update existing tasks to simulate multi-day spans
-- We set start_date to 3 days before deadline for some tasks, 
-- and 7 days before for others to test spanning across weeks.

-- Tasks with deadline in the future (e.g. 2026-05-28, 2026-05-29)
UPDATE tasks 
SET start_date = (deadline - INTERVAL '3 days')::DATE
WHERE deadline IS NOT NULL AND title LIKE '%Ngày mai%';

UPDATE tasks 
SET start_date = (deadline - INTERVAL '4 days')::DATE
WHERE deadline IS NOT NULL AND title LIKE '%Thứ 6%';

UPDATE tasks 
SET start_date = (deadline - INTERVAL '10 days')::DATE
WHERE deadline IS NOT NULL AND title LIKE '%Tháng sau%';

-- Update some current day tasks
UPDATE tasks 
SET start_date = (deadline - INTERVAL '2 days')::DATE
WHERE deadline = '2026-05-27' AND status != 'DONE';

-- Ensure DONE tasks also have valid start dates
UPDATE tasks 
SET start_date = (completed_at - INTERVAL '2 days')::DATE
WHERE status = 'DONE' AND completed_at IS NOT NULL;
