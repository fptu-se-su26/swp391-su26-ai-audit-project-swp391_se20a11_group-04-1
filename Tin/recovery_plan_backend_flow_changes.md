# Recovery Plan Backend Flow Implementation (Human-in-the-loop)

## Overview
Đã triển khai hoàn tất toàn bộ luồng Backend cho tính năng Recovery Plan (Level 5 SLA) với sự tham gia của con người (Leader/Mentor) trong vòng lặp (Human-in-the-loop). 

## Các thay đổi chính

### 1. Database & Migrations
- `V20260612235000__add_human_in_the_loop_recovery_plans.sql`: Tạo bảng `recovery_plans` và `recovery_plan_actions`.
- `V20260613001000__add_unique_index_active_recovery_plan.sql`: Thêm Unique Index (Partial) để chống race condition khi tạo plan cho cùng 1 task.
- `V20260613004500__add_recovery_plan_audit_logs.sql`: Tạo bảng `recovery_plan_audit_logs` để tracking đầy đủ lịch sử của các hành động duyệt/từ chối/chạy tự động của plan.

### 2. Entities & Enums mới
- **Entities**: 
  - `RecoveryPlan.java`
  - `RecoveryPlanAction.java`
  - `RecoveryPlanAuditLog.java`
- **Enums**:
  - `RecoveryPlanStatus`: PENDING_APPROVAL, APPROVED, REJECTED, EXECUTING, EXECUTED, FAILED
  - `RecoveryPlanActionStatus`: PENDING, APPROVED, EXECUTED, SKIPPED, FAILED
  - `RecoveryActionType`: NOTIFY_ASSIGNEE, REQUEST_EVIDENCE, ASK_BLOCKER_UPDATE, SCHEDULE_FOLLOW_UP, ESCALATE_LEADER, CREATE_RECOVERY_CHECKLIST, SUGGEST_SPLIT_TASK, SUGGEST_REASSIGN
  - `RecoveryPlanSource`: RULE, AI
  - `RecoveryPlanAuditEventType`: PLAN_GENERATED, PLAN_APPROVED, PLAN_REJECTED, PLAN_EXECUTION_STARTED, PLAN_EXECUTED, PLAN_FAILED, ACTION_EXECUTED, ACTION_SKIPPED, ACTION_FAILED

### 3. Repositories
- `RecoveryPlanRepository.java`
- `RecoveryPlanActionRepository.java`
- `RecoveryPlanAuditLogRepository.java`

### 4. Controller Endpoints (`RecoveryPlanController.java`)
- `POST /api/v1/projects/{projectId}/tasks/{taskId}/recovery-plans/generate`: Khởi tạo plan mới dựa trên ruleset hiện hành (chỉ sinh, chưa duyệt).
- `GET /api/v1/projects/{projectId}/tasks/{taskId}/recovery-plans/latest`: Lấy thông tin plan mới nhất của một task.
- `PATCH /api/v1/projects/{projectId}/recovery-plans/{planId}/approve`: Leader/Mentor duyệt plan.
- `PATCH /api/v1/projects/{projectId}/recovery-plans/{planId}/reject`: Leader/Mentor từ chối plan (cần reason).
- `PATCH /api/v1/projects/{projectId}/recovery-plans/{planId}/execute`: Chạy tự động các actions trong plan sau khi duyệt.
- `GET /api/v1/projects/{projectId}/recovery-plans/{planId}/audit-logs`: Lấy danh sách lịch sử log.

### 5. Logic xử lý lõi (`RecoveryPlanService.java`)
- **Generate**: 
  - Validate role, check task chưa `DONE`, ngăn tạo trùng plan đang active.
  - Phân tích SLA categories để sinh tự động các Action logic (vd: Notify, Create Checklist).
  - Khắc phục lỗi **idempotencyKey**: Key giờ đây sử dụng trực tiếp `planId` thay vì ngày tháng để đảm bảo tính độc lập khi sinh nhiều plan trong cùng 1 ngày (sau khi plan trước đó bị reject).
- **Approve/Reject**: 
  - Chỉ Member mang role (LEADER/MENTOR/PROJECT_LEADER) mới có quyền gọi hàm này. 
  - Đồng bộ cập nhật trạng thái của các actions con tương ứng.
- **Execute Safe Actions**: 
  - Thực thi theo trạng thái an toàn:
    - `NOTIFY_ASSIGNEE`, `REQUEST_EVIDENCE`, `ASK_BLOCKER_UPDATE`: Đẩy Notification tự động đến user.
    - `CREATE_RECOVERY_CHECKLIST`: Gắn checklist mới vào task.
    - `ESCALATE_LEADER`: Thông báo tới toàn bộ Leader/Mentor trong dự án.
    - Các action cần can thiệp tay (`SCHEDULE_FOLLOW_UP`, v.v) sẽ được đẩy qua trạng thái `SKIPPED` với thông báo cụ thể.
  - Tự động thay đổi status của Plan về `FAILED` hoặc `EXECUTED` phụ thuộc vào kết quả của các actions.
- **Audit Tracking**: Bắt buộc ghi nhận từng trạng thái chuyển tiếp vào bảng Audit Logs.

### Trạng thái
- Tất cả các luồng đã được xây dựng và **BUILD SUCCESS**. Logic đã rất kín kẽ và bảo vệ toàn bộ dữ liệu hiện có (SLA gốc không bị ảnh hưởng).
- Đã commit lên nhánh: `feature/de190364-sla-decision-pack`.
- Chưa có giao diện (Sẽ làm ở bước tiếp theo).
