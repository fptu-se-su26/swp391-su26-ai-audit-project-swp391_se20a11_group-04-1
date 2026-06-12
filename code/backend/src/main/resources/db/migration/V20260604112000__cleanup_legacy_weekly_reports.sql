-- Migration: V20260604112000__cleanup_legacy_weekly_reports.sql
-- Date: 2026-06-04
-- Description: Clean up old weekly reports that have invalid date ranges (legacy data)

-- Xoá các báo cáo không đủ 7 ngày (từ thứ 2 đến chủ nhật)
-- hoặc ngày kết thúc không phải là Chủ nhật (ISODOW = 7)
DELETE FROM weekly_reports
WHERE (report_week_end - report_week_start) != 6
   OR EXTRACT(ISODOW FROM report_week_end) != 7;
