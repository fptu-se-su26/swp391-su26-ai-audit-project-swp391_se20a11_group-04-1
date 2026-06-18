# AI Audit Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học |  |
| Mã môn học |  |
| Lớp |  |
| Học kỳ |  |
| Tên bài tập / Project |  |
| Tên sinh viên / Nhóm |  |
| MSSV / Danh sách MSSV |  |
| Giảng viên hướng dẫn |  |
| Ngày bắt đầu |  |
| Ngày hoàn thành |  |

---

## 2. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [ ] ChatGPT
- [ ] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Perplexity
- [ ] Microsoft Copilot
- [ ] Công cụ khác: ....................................

---

## 3. Mục tiêu sử dụng AI

Mô tả ngắn gọn sinh viên/nhóm đã sử dụng AI để hỗ trợ những công việc nào.

Ví dụ:

- Phân tích yêu cầu bài toán
- Gợi ý ý tưởng giải pháp
- Thiết kế database
- Thiết kế giao diện
- Viết code mẫu
- Debug lỗi
- Tối ưu code
- Viết test case
- Kiểm tra bảo mật
- Viết báo cáo
- Chuẩn bị slide thuyết trình
- Tìm hiểu công nghệ mới

### Mô tả mục tiêu sử dụng AI

```text
- Hỗ trợ phân tích luồng chạy (execution flow) giữa Cloud Worker và Local Agent.
- Đề xuất kiến trúc tích hợp CDP Screencast qua WebSocket.
- Viết script nhúng kết nối WebSocket cho LocalTestRunWorker (Spring Boot).
- Cấu hình YAML và debug lỗi Idempotency key.

## 4. Nhật ký sử dụng AI chi tiết

> Mỗi lần sử dụng AI cho một phần quan trọng của bài tập/project, sinh viên cần ghi lại theo mẫu bên dưới.  
> Sinh viên/nhóm có thể nhân bản mẫu “Lần sử dụng AI” nhiều lần tùy theo số lần sử dụng AI thực tế.

---

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác |
| Mục đích sử dụng |  |
| Phần việc liên quan | Requirement / Design / Database / Frontend / Backend / Testing / Debug / Report / Presentation / Other |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ một phần / Hỗ trợ nhiều / Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
Dán nguyên văn prompt đã hỏi AI tại đây.
```

#### 4.2. Kết quả AI gợi ý

Tóm tắt nội dung AI đã trả lời hoặc gợi ý.

```text
AI đã đề xuất kiến trúc CDP Screencast sử dụng WebSocket Stream: Local Agent sẽ chạy Playwright, gọi CDP protocol bắt frame và truyền qua WebSocket về Backend. Backend sẽ broadcast frame cho giao diện LiveTestRunner của người dùng.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

Mô tả rõ phần nào được sử dụng lại từ gợi ý của AI.

```text
- Kiến trúc Stream qua WebSocket.
- Logic kết nối WebSocket phía Client (LiveTestRunner.jsx).
- Các logic xử lý base cho Playwright CDP (Page.startScreencast).
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

Mô tả sinh viên/nhóm đã thay đổi, kiểm tra, sửa lỗi hoặc cải tiến gì so với gợi ý ban đầu của AI.

```text
- Phát hiện và fix bug thiếu tham số envOverrides trong executor.js khiến toàn bộ Local Agent bị crash.
- Phát hiện AI thêm key YAML bị duplicate (`app:`) khiến Spring Boot override mất public-ws-url, tự sửa lại cấu trúc.
- Phát hiện lỗi conflict thư viện Lombok (`@RequiredArgsConstructor` với `@Value` non-final) và tự đưa ra quyết định refactor cấu trúc class.
- Tự fix lại mapping UX/UI logic cho `RunTestCase.jsx` khi Index của các Test case cũ không khớp với mảng Execution.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

Sinh viên/nhóm học được gì sau lần sử dụng AI này?

```text
Học được cách làm việc như một Peer-programmer với AI: AI có thể đưa ra kiến trúc rất tốt và code nền tảng tuyệt vời, nhưng người kỹ sư phải là người review code, phát hiện các "hidden bugs" (như duplicate config, lombok conflict, runtime param missing) để hệ thống thực sự chạy được trên production. Việc chủ động phân tích log và tự fix code giúp tôi làm chủ hệ thống hoàn toàn.
```

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác |
| Mục đích sử dụng |  |
| Phần việc liên quan | Requirement / Design / Database / Frontend / Backend / Testing / Debug / Report / Presentation / Other |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ một phần / Hỗ trợ nhiều / Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
"tôi cần implement tính năng async test execution cho DevTrackAI chuyển từ synchronous sang fully async với Kafka + WebSocket realtime, xử lý race condition, semantic lỗi, và multi-instance issues"
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất kiến trúc gồm: dùng Kafka làm Event Bus, Outbox pattern để lưu event, WebSocket đẩy realtime data về Frontend, và ShedLock cho việc quản lý distributed watchdog scheduler.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Tích hợp cấu hình thư viện ShedLock, Kafka vào Spring Boot.
- Toàn bộ State Machine cho TestRunStatus và TestExecutionStatus (RUNNING, CANCELLED, COMPLETED).
- Cấu trúc thư mục DB Migration.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Tự thiết kế lại Kafka Event Payload: Yêu cầu AI làm "Thin Event" (chỉ chứa correlationId, testRunId) thay vì truyền toàn bộ `testSteps` nặng nề vào Kafka.
- Tự fix logic tính toán `completedCount` trên DB bằng Query Update Atomic để tránh Race Condition thay vì đọc-ghi qua code Java theo hướng dẫn cũ của AI.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Lần sử dụng này rất giá trị vì hệ thống phân tán có quá nhiều edge cases. Việc thảo luận kiến trúc (Architecture review) với AI giúp tiết kiệm hàng tuần debug. Tuy nhiên, AI không hiểu rõ luồng data size nên tôi phải tự quyết định việc làm mỏng Kafka Payload.
```

---

### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác |
| Mục đích sử dụng |  |
| Phần việc liên quan | Requirement / Design / Database / Frontend / Backend / Testing / Debug / Report / Presentation / Other |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ một phần / Hỗ trợ nhiều / Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
"Tôi cần chuẩn hóa luồng Database Migration dùng Flyway cho dự án DevTrackAI, hãy gợi ý cấu trúc bảng Test Run, Execution và naming convention tốt nhất cho PostgreSQL."
```

#### 4.2. Kết quả AI gợi ý

```text
Gợi ý thiết lập cấu trúc V1__init.sql, V2__async_flow.sql. Tạo bảng test_runs, test_executions, bổ sung foreign keys, indices, và cột idempotency_key.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Quy tắc naming convention V{version}__{description}.sql
- Các Data type map sang PostgreSQL (VARCHAR, TIMESTAMP, BIGINT).
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Tự viết thêm Partial Index cho cột status để tối ưu Watchdog Query (VD: `CREATE INDEX ON test_runs(updated_at) WHERE status = 'RUNNING'`).
- Tự thêm constraints Unique Partial cho `idempotency_key` thay vì Unique hoàn toàn, tránh crash khi key bị null.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
AI cung cấp syntax SQL rất chuẩn và nhanh, nhưng thiết kế Index cho DB phải dựa vào business query thực tế (như Watchdog cần query RUNNING state) thì sinh viên phải tự tư duy và optimize.
```

---

## 5. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu | X |  |  |  | Tự phân tích luồng |
| Viết user story/use case | X |  |  |  |  |
| Thiết kế database |  |  | X |  | Dùng AI hỗ trợ Flyway |
| Thiết kế kiến trúc hệ thống |  |  | X |  | Dùng AI thảo luận Kafka |
| Thiết kế giao diện | X |  |  |  |  |
| Code frontend | X |  |  |  |  |
| Code backend |  | X |  |  | AI tạo code cơ bản, sinh viên tự debug lỗi hệ thống |
| Debug lỗi |  | X |  |  | Tự tìm ra bug qua log |
| Viết test case | X |  |  |  |  |
| Kiểm thử sản phẩm | X |  |  |  |  |
| Tối ưu code |  | X |  |  | Tự tối ưu lại Payload |
| Viết báo cáo | X |  |  |  |  |
| Làm slide thuyết trình | X |  |  |  |  |

---

## 6. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | AI quên khai báo biến `envOverrides` trong hàm `executeScript` NodeJS | Đọc log báo ReferenceError | Chủ động sửa hàm và truyền biến môi trường vào Playwright |
| 2 | AI merge file application.yaml bị duplicate key `app:` | Nhận thấy endpoint backend không ăn cấu hình WS_URL | Xóa key duplicate, gộp lại thành 1 block YAML hợp lệ |
| 3 | AI dùng đọc-ghi dữ liệu Java để tăng `completedCount` | Nhận ra race condition nếu có nhiều worker | Chuyển sang dùng Atomic JPQL query |

---

## 7. Kiểm chứng kết quả AI

Mô tả cách sinh viên/nhóm kiểm tra lại kết quả do AI gợi ý.

Có thể bao gồm:

- Chạy thử chương trình
- Viết test case
- So sánh với yêu cầu đề bài
- Kiểm tra output
- Đối chiếu tài liệu môn học
- Hỏi lại giảng viên
- Review cùng thành viên nhóm
- Kiểm tra lỗi bảo mật
- Kiểm tra bằng dữ liệu mẫu
- So sánh trước và sau khi dùng AI

### Nội dung kiểm chứng

```text
- Chạy thử chương trình Local Agent và quan sát WebSocket Frame kết nối tới LiveTestRunner.
- Mở DevTools để xem Network tab có bị overload bởi Playwright frames hay không.
- Chạy giả lập Multi-instance Backend và xem ShedLock có khóa chuẩn xác một instance cho Watchdog không.
- Phân tích Log lỗi khi Playwright fail để trace bug từ `envOverrides`.
```

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Mô tả phần sinh viên tự làm, phần AI hỗ trợ và phần đã tự cải tiến.

```text
Viết tại đây...
```

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
|  |  |  | Có / Không |  |
|  |  |  | Có / Không |  |
|  |  |  | Có / Không |  |
|  |  |  | Có / Không |  |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
Viết tại đây...
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
Viết tại đây...
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
Viết tại đây...
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Viết tại đây...
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
Viết tại đây...
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
Viết tại đây...
```

---

## 10. Cam kết học thuật

Sinh viên/nhóm cam kết rằng:

- Nội dung AI hỗ trợ đã được ghi nhận trung thực.
- Không nộp nguyên văn kết quả AI mà không kiểm tra.
- Có khả năng giải thích các phần đã nộp.
- Chịu trách nhiệm về tính đúng đắn của sản phẩm cuối cùng.
- Hiểu rằng việc sử dụng AI không khai báo có thể ảnh hưởng đến kết quả đánh giá.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
|  |  |
