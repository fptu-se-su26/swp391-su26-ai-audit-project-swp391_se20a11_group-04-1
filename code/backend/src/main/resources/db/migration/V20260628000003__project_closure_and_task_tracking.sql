-- ============================================================
-- Project Closure & Task Tracking
-- ============================================================

-- 1. Thêm CANCELLED vào task_status_enum
ALTER TYPE task_status_enum ADD VALUE IF NOT EXISTS 'CANCELLED';

-- 2. Thêm trường đóng project vào bảng projects
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS closed_at   TIMESTAMP,
    ADD COLUMN IF NOT EXISTS closed_reason TEXT;

-- 3. Thêm trường tracking công việc vào bảng tasks
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS started_at     TIMESTAMP,
    ADD COLUMN IF NOT EXISTS actual_hours   NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS quality_score  SMALLINT;
