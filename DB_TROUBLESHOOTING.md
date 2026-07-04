# Hướng Dẫn Khắc Phục Lỗi Cơ Sở Dữ Liệu (Flyway DB Migration Troubleshooting)

Tài liệu này tổng hợp các lỗi cơ sở dữ liệu thường gặp trong quá trình phát triển dự án với Flyway và cách khắc phục nhanh chóng trên môi trường Local.

---

## 1. Lỗi chạy lại script cũ bị gián đoạn (Migration Failed Halfway)

### Triệu chứng (Error logs)
Ứng dụng Spring Boot bị crash khi khởi động với thông báo:
```text
Caused by: org.flywaydb.core.internal.exception.FlywayMigrateException: Failed to execute script V20260625000002__upgrade_outbox_pattern.sql
...
Caused by: org.postgresql.util.PSQLException: ERROR: column "idempotency_key" of relation "outbox_events" already exists
```

### Nguyên nhân
Lần chạy đầu tiên của script đó bị lỗi hoặc mất kết nối giữa chừng, Flyway ghi nhận trạng thái **FAILED** trong bảng lịch sử. Ở lần khởi động sau, Flyway chạy lại toàn bộ script đó nhưng do một số cột/bảng đã được tạo ở lần trước nên xảy ra xung đột "đã tồn tại".

### Cách khắc phục (Chạy SQL trên pgAdmin/DBeaver)
Chạy script SQL sau để dọn dẹp các trường/bảng đã tạo dở dang và xóa lịch sử lỗi của phiên bản đó:

```sql
-- 1. Xóa cột idempotency_key bị thừa ở bảng outbox_events
ALTER TABLE outbox_events DROP COLUMN IF EXISTS idempotency_key;

-- 2. Xóa các bảng processed_events và dead_letter_events (nếu có)
DROP TABLE IF EXISTS processed_events, dead_letter_events CASCADE;

-- 3. Xóa bản ghi bị FAILED của phiên bản này trong bảng lịch sử Flyway
DELETE FROM flyway_schema_history WHERE version = '20260625000002';
```
*Sau đó, chỉ cần khởi động lại ứng dụng Spring Boot.*

---

## 2. Lỗi sai lệch mã băm file Migration (Migration Checksum Mismatch)

### Triệu chứng (Error logs)
```text
Migration checksum mismatch for migration version 20260625000002
-> Applied to database : 123456789 (hoặc mã khác)
-> Resolved locally    : 987654321 (hoặc mã khác)
```

### Nguyên nhân
Ai đó đã thay đổi nội dung của một file migration cũ (ví dụ: sửa file `V20260625000002...sql`) sau khi file đó đã được chạy trên máy của bạn hoặc máy của thành viên khác.

### Cách khắc phục
* **Bước 1**: Đưa file migration bị sửa đổi về trạng thái gốc bằng Git:
  ```bash
  git checkout src/main/resources/db/migration/V20260625000002__upgrade_outbox_pattern.sql
  ```
* **Bước 2**: Nếu bạn bắt buộc phải áp dụng thay đổi đó, hãy xóa lịch sử chạy cũ của file đó đi để Flyway nạp lại:
  ```sql
  DELETE FROM flyway_schema_history WHERE version = '20260625000002';
  ```
* **Bước 3** (Nếu cài đặt plugin Maven Flyway): Chạy lệnh repair để Flyway tự đồng bộ lại checksum ở máy local của bạn:
  ```bash
  mvn flyway:repair
  ```

---

## 3. Reset toàn bộ Database Local (Khi lỗi quá nặng)

Nếu dữ liệu local bị lỗi cấu trúc nghiêm trọng hoặc không thể đồng bộ với các thành viên khác, hãy reset database về trạng thái ban đầu:

### Các bước thực hiện:
1. Mở PostgreSQL Client (pgAdmin hoặc DBeaver).
2. Click chuột phải vào database `dev_track_ai` -> Chọn **Delete/Drop** để xóa bỏ hoàn toàn.
3. Click chuột phải vào mục **Databases** -> Chọn **Create** -> **Database...** -> Điền tên là `dev_track_ai` để tạo mới database trống.
4. Chạy lại ứng dụng Spring Boot Backend. Flyway sẽ tự động chạy toàn bộ các file migration từ `V1` đến phiên bản mới nhất trên DB trống này.
