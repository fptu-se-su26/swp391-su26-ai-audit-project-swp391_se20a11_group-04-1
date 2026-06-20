-- Migration: V20260610181000__make_daily_digests_project_isolated.sql
-- Date: 2026-06-10
-- Description: Make daily digests project isolated by adding project_id column and adjusting unique index

-- Dọn dẹp dữ liệu cũ để tránh xung đột khóa ngoại
DELETE FROM daily_digest_items;
DELETE FROM daily_digests;

-- Drop index unique cũ
DROP INDEX IF EXISTS uq_daily_digests_user_date_type;

-- Thêm cột project_id
ALTER TABLE daily_digests
    ADD COLUMN IF NOT EXISTS project_id BIGINT NOT NULL;

-- Thêm khóa ngoại
ALTER TABLE daily_digests
    ADD CONSTRAINT fk_daily_digests_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE;

-- Tạo unique index mới theo project-scope
CREATE UNIQUE INDEX uq_daily_digests_user_project_date_type
    ON daily_digests(user_id, project_id, digest_date, digest_type);

-- Tạo index phụ cho cột project_id phục vụ tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_daily_digests_project ON daily_digests(project_id);


