-- Migration: V20260527233000__rename_tasks_for_simplicity.sql
-- Description: Đổi tên các task test thành tên thực tế, đơn giản, dễ đọc

UPDATE tasks SET title = 'Thiết kế Database' WHERE task_code = 'TASK-01';
UPDATE tasks SET title = 'Viết API Đăng nhập' WHERE task_code = 'TASK-02';
UPDATE tasks SET title = 'Tích hợp thanh toán' WHERE task_code = 'TASK-03';
UPDATE tasks SET title = 'Fix lỗi giao diện' WHERE task_code = 'TASK-04';
UPDATE tasks SET title = 'Review code Sprint 1' WHERE task_code = 'TASK-05';
UPDATE tasks SET title = 'Họp team đầu tuần' WHERE task_code = 'TASK-06';
UPDATE tasks SET title = 'Cấu hình Server' WHERE task_code = 'TASK-07';
UPDATE tasks SET title = 'Tối ưu Query SQL' WHERE task_code = 'TASK-08';
UPDATE tasks SET title = 'Viết tài liệu API' WHERE task_code = 'TASK-09';
UPDATE tasks SET title = 'Thiết kế trang Chủ' WHERE task_code = 'TASK-10';
UPDATE tasks SET title = 'Gắn Analytics' WHERE task_code = 'TASK-11';
UPDATE tasks SET title = 'Logic Giỏ hàng' WHERE task_code = 'TASK-12';
UPDATE tasks SET title = 'Refactor code cũ' WHERE task_code = 'TASK-13';
UPDATE tasks SET title = 'Fix bug Đăng xuất' WHERE task_code = 'TASK-14';
UPDATE tasks SET title = 'Deploy Staging' WHERE task_code = 'TASK-15';
UPDATE tasks SET title = 'Làm trang Profile' WHERE task_code = 'TASK-16';
UPDATE tasks SET title = 'Setup CI/CD Pipeline' WHERE task_code = 'TASK-17';
UPDATE tasks SET title = 'Unit test User' WHERE task_code = 'TASK-18';
UPDATE tasks SET title = 'Lấy YC khách hàng' WHERE task_code = 'TASK-19';
UPDATE tasks SET title = 'Báo cáo Sprint' WHERE task_code = 'TASK-20';
