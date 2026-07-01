# Prompt Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Engineering Practice |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | Summer 2026 |
| Tên bài tập / Project | DevTrack AI — AI-Powered Test Management Platform |
| Tên sinh viên / Nhóm | Phạm Duy Hưng — Group 04 |
| MSSV / Danh sách MSSV | DE190330 |
| Giảng viên hướng dẫn | |
| Ngày bắt đầu | 01/05/2026 |
| Ngày cập nhật gần nhất | 30/06/2026 |

---

## 2. Mục đích của file Prompt Log

File này ghi lại các prompt quan trọng đã sử dụng trong quá trình xây dựng DevTrack AI —
từ giai đoạn phân tích yêu cầu, thiết kế kiến trúc bất đồng bộ (Kafka/Outbox/WebSocket),
Local Agent, module AI Gen TestCase, module API Testing, cho đến UI Design System và hạ tầng
scale.

---

## 3. Công cụ AI đã sử dụng

- [ ] ChatGPT
- [ ] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [ ] Công cụ khác: ....................................

---

## 4. Bảng tổng hợp prompt đã sử dụng (45 prompt)

| STT | Ngày | Công cụ AI | Loại | Mục đích | Prompt tóm tắt | Kết quả chính | Có sử dụng vào bài không? | Minh chứng |
|---:|---|---|---|---|---|---|---|---|
| 1 | 04/05 | Antigravity | Requirement Analysis | Xác định Business Goals & User Roles | "Phân tích đề bài DevTrack AI, đề xuất Business Goals và User Roles cho hệ thống quản lý test case tích hợp AI" | Khung Business Goals + 3 vai trò (Owner/PM/Tester) | Có | `SRS.md` mục 1.2, 1.3 |
| 2 | 05/05 | Antigravity | Requirement Analysis | Lập Feature Inventory | "Từ Business Goals đã có, liệt kê đầy đủ Feature Inventory theo module (Requirement, Test Case, Test Run, API Testing, Bug Tracking)" | Bảng feature theo module | Có | `SRS.md` Phase 2 |
| 3 | 06/05 | Antigravity | Requirement Analysis | Screen Inventory | "Liệt kê toàn bộ màn hình cần thiết dựa trên Feature Inventory, nhóm theo luồng người dùng" | Danh sách SCR-01 đến SCR-xx | Có | `SRS.md` Phase 3 |
| 4 | 07/05 | Antigravity | Documentation | Chuẩn hoá khung Screen Specification | "Thiết kế 1 khung mẫu chung (trigger, actor, API call, DB entity, business rule, flow) để mô tả nhất quán cho mọi màn hình" | Template Screen Spec | Có | `SRS.md` Phase 4 |
| 5 | 08/05 | Antigravity | Requirement Analysis | Đặc tả SCR-01 LoginPage | "Áp dụng khung Screen Spec cho LoginPage, bao gồm cả Abnormal Cases (sai mật khẩu, tài khoản khoá)" | Đặc tả đầy đủ LoginPage | Có | `SRS.md` SCR-01 |
| 6 | 09/05 | Antigravity | Requirement Analysis | Đặc tả SCR-04 ProjectDashboardPage | "Đặc tả ProjectDashboardPage: API calls, DB entities liên quan đến project stats" | Đặc tả ProjectDashboardPage | Có | `SRS.md` SCR-04 |
| 7 | 10/05 | Antigravity | UML | Vẽ sequence diagram luồng đăng nhập | "Vẽ sequence diagram Mermaid cho luồng Login bao gồm case sai mật khẩu 3 lần bị khoá" | Sequence diagram Mermaid | Có | `SRS.md` |
| 8 | 15/05 | Antigravity | Database / Architecture | Thiết kế state machine TestRun/TestExecution | (Xem chi tiết Prompt #2 mục 5) | State machine đầy đủ | Có | `SUPER_PROMPT_ASYNC_TEST_EXECUTION.md` mục 6 |
| 9 | 16/05 | Antigravity | Architecture | Thiết kế Outbox Pattern | "Giải thích Outbox Pattern áp dụng cho Spring Boot + Kafka, tại sao cần thay vì publish trực tiếp trong transaction" | Giải thích + schema OutboxEvent | Có | `OutboxEvent` entity |
| 10 | 17/05 | Antigravity | API Design | Thiết kế event taxonomy Kafka vs WebSocket | "Phân biệt rõ Kafka command payload (thin, chỉ ID) và WebSocket event (rich, đầy đủ data) cho frontend, giải thích lý do tách biệt" | Bảng event taxonomy | Có | `SUPER_PROMPT_ASYNC_TEST_EXECUTION.md` mục 7 |
| 11 | 18/05 | Antigravity | Spring Boot | Thiết kế WatchdogScheduler | "Thiết kế 1 scheduler định kỳ phát hiện TestRun bị stuck (RUNNING quá lâu không cập nhật), dùng ShedLock để tránh chạy trùng khi có nhiều instance backend" | WatchdogScheduler skeleton + ShedLock | Có | `SUPER_PROMPT_ASYNC_TEST_EXECUTION.md` mục 8 |
| 12 | 20/05 | Antigravity | Database / Debug | Chẩn đoán lỗi Flyway/Hibernate | (Xem chi tiết Prompt #3 mục 5) | Xác định 3 nguyên nhân + fix | Có | Migration files |
| 13 | 21/05 | Antigravity | Database | Đặt tên convention cho migration | "Đề xuất naming convention cho các file Flyway migration của DevTrackAI để tránh trùng version khi nhiều thành viên cùng tạo migration" | Convention `V<timestamp>__description.sql` | Có | `V20260612100000__*.sql` |
| 14 | 22/05 | Antigravity | Security | Thiết kế xác thực nội bộ giữa services | "Thiết kế cơ chế xác thực cho các endpoint /internal/** giữa Backend và Playwright Service, không dùng session user" | Header `X-Internal-Service-Key` | Có | `SecurityConfig.java` |
| 15 | 23/05 | Antigravity | Validation | Validate payload OutboxEvent | "Đề xuất validation cho payload OutboxEvent trước khi publish lên Kafka để tránh publish message rỗng/thiếu field" | Validation checklist | Có | `KafkaEventPublisher.java` |
| 16 | 24/05 | Antigravity | Refactoring | Tách thin Kafka payload | "Refactor payload Kafka đang gửi cả object TestCase đầy đủ, chỉ nên gửi ID để giảm băng thông và tránh dữ liệu cũ" | Payload chỉ gồm ID | Có | `KafkaEventPublisher.java` |
| 17 | 25/05 | Antigravity | Debug | Phân tích lỗi 2 TestCase không chạy song song | (Xem chi tiết Prompt #4 mục 5) | 3 nguyên nhân gốc + giải pháp | Có | `analysis_parallel_testrun_V6.md` |
| 18 | 26/05 | Antigravity | Performance | So sánh 3 giải pháp fix song song hoá | "So sánh effort/risk/hiệu quả giữa 3 giải pháp: dùng Kafka key, fire-and-forget, và kết hợp key+semaphore" | Bảng so sánh 3 giải pháp | Có | `analysis_parallel_testrun_V6.md` mục cuối |
| 19 | 27/05 | Antigravity | Spring Boot | Sửa `KafkaEventPublisher` dùng key | "Viết lại KafkaEventPublisher.publish() để dùng aggregateId (testRunId) làm Kafka message key" | Code diff KafkaEventPublisher | Có | `KafkaEventPublisher.java` |
| 20 | 28/05 | Antigravity | Architecture | Thiết kế Local Agent | (Xem chi tiết Prompt #5 mục 5) | AgentTask entity + 4 endpoint | Có | `devtrack_local_agent_prompt.md` |
| 21 | 29/05 | Antigravity | Database | Thiết kế bảng agent_tasks | "Thiết kế schema bảng agent_tasks với status PENDING/CLAIMED/COMPLETED/FAILED/TIMEOUT, kèm migration Flyway" | Migration `agent_tasks` | Có | Flyway migration |
| 22 | 30/05 | Antigravity | Security | Thiết kế Agent Token | "So sánh việc lưu agent_token trực tiếp trên Project entity so với tạo bảng AgentToken riêng, đề xuất phương án cho quy mô 1 token/project" | Khuyến nghị thêm cột trên Project | Có | `Project.java` |
| 23 | 01/06 | Antigravity | React | Thiết kế banner cảnh báo localhost | "Thiết kế UI banner cảnh báo khi user nhập base_url chứa 'localhost', kèm nút Copy lệnh npx devtrack-agent" | Banner component | Có | TestCase form |
| 24 | 01/06 | Antigravity | Node.js | Viết vòng lặp polling Agent CLI | (Xem chi tiết Prompt #6 mục 5) | agent.js polling skeleton | Có | `devtrack-agent/agent.js` |
| 25 | 02/06 | Antigravity | React / Backend | Review/Approve flow AI Gen TestCase | (Xem chi tiết Prompt #1 mục 5) | Kiến trúc Review/Approve đầy đủ | Có | `AIGentestcase_plan.md` |
| 26 | 02/06 | Antigravity | API Design | Thiết kế endpoint approve | "Thiết kế endpoint POST /generate-ai/{generationId}/approve nhận selectedIndices + modifiedPayload, trả về danh sách TestCase đã tạo" | Endpoint spec | Có | `TestCaseController.java` |
| 27 | 03/06 | Antigravity | React | AiTestCaseReviewModal 3-panel | "Thiết kế component 3-panel (AI Analysis / Test Case List / Detail Editor) cho màn hình review test case do AI sinh ra" | Skeleton component | Có | `AiTestCaseReviewModal.jsx` |
| 28 | 04/06 | Antigravity | Refactoring | Refactor modal full-page → fixed modal | "Refactor AiTestCaseReviewModal từ full-page layout sang fixed modal có overflow scroll để không vỡ trên màn hình nhỏ" | Refactor CSS/layout | Có | `AiTestCaseReviewModal.jsx` |
| 29 | 05/06 | Antigravity | Debug | Chẩn đoán mất screenshot Local Agent | (Xem chi tiết Prompt #7 mục 5) | Xác định field mismatch + pipeline fix | Có | `implementation_plan_fix_Agent.md` |
| 30 | 06/06 | Antigravity | Backend | Thiết kế storeBase64File | "Thiết kế hàm storeBase64File(base64, filename) trên FileStorageService, decode và upload lên Cloudinary, có fallback cho Mock service khi test" | Interface + 2 impl | Có | `FileStorageService.java` |
| 31 | 07/06 | Antigravity | QA | Checklist kiểm thử luồng screenshot | "Đề xuất checklist kiểm thử thủ công cho tính năng upload screenshot: chạy 1 test qua Local Agent, kiểm tra log backend, kiểm tra ảnh hiển thị trên UI" | Checklist 3 bước | Có | `implementation_plan_fix_Agent.md` mục Verification |
| 32 | 08/06 | Antigravity | Performance / DevOps | Đánh giá khả năng scale của worker.js | (Xem chi tiết Prompt #8 mục 5) | Xác nhận thiết kế sẵn sàng scale + risk | Có | `scale-horizontal-kubernetes.md` |
| 33 | 08/06 | Antigravity | DevOps | Viết Kubernetes Deployment manifest | "Viết Deployment YAML cho playwright-worker với resource requests/limits hợp lý cho 1 instance Chromium + Node" | Deployment YAML | Có | `scale-horizontal-kubernetes.md` mục 4.1 |
| 34 | 09/06 | Antigravity | DevOps | Thiết kế KEDA ScaledObject | "Thiết kế KEDA ScaledObject scale theo Kafka consumer lag, minReplicaCount=1, maxReplicaCount=20" | ScaledObject YAML | Có | `scale-horizontal-kubernetes.md` mục 4.2 |
| 35 | 10/06 | Antigravity | Backend / Architecture | Thiết kế backend API Testing | (Xem chi tiết Prompt #9 mục 5) | Schema + luồng dual-path (public/local) | Có | `TTapi_testing_implementation_plan.md` |
| 36 | 10/06 | Antigravity | Refactoring | Né circular dependency bằng Spring Event | "Refactor ApiTestExecutorService đang gọi trực tiếp AgentTaskService (rủi ro circular dependency) sang dùng ApplicationEventPublisher" | Spring Event pattern | Có | `ApiTestJobCompletedEvent.java` |
| 37 | 11/06 | Antigravity | Spring Boot | Thiết kế thread pool riêng cho API Testing | "Thiết kế bean apiTestExecutor riêng biệt (ThreadPoolTaskExecutor) để không làm cạn pool async mặc định" | `AsyncConfig.java` bean | Có | `AsyncConfig.java` |
| 38 | 12/06 | Antigravity | API Design | Thiết kế response PENDING chuẩn hoá | "Định nghĩa response HTTP 200 kèm body {status: PENDING} khi API Test đang chờ Local Agent, để Frontend phân biệt với lỗi thật" | Response contract | Có | `ApiTestController.java` |
| 39 | 12/06 | Antigravity | React | Thiết kế UI split-pane API Testing | (Xem chi tiết Prompt #10 mục 5) | ApiTestPage + useApiTestStore | Có | `UI_API_TESTING_PLAN` |
| 40 | 13/06 | Antigravity | Debug | Fix memory leak polling | "Phát hiện polling interval không được clear khi user chạy lại test trước khi polling cũ kết thúc, đề xuất fix" | stopPolling() ở 2 điểm gọi | Có | `useApiTestStore.js` |
| 41 | 13/06 | Antigravity | Backend | AI generator cho API Test | "Thiết kế AiApiTestGeneratorService gọi Gemini với responseMimeType application/json, xử lý lỗi parse JSON an toàn" | Service + try/catch parse | Có | `AiApiTestGeneratorService.java` |
| 42 | 14/06 | Antigravity | React / UI Design | Redesign toàn bộ theme màu Teal | (Xem chi tiết Prompt #11 mục 5) | Bảng token màu đầy đủ | Có | `UI.md` |
| 43 | 15/06 | Antigravity | Refactoring | Áp dụng token màu vào Sidebar | "Áp dụng bảng token Teal vào Sidebar.jsx, giữ nguyên animation sliding pill kiểu iOS đã có" | Sidebar.jsx re-skin | Có | `UI.md` mục 3.4 |
| 44 | 20/06 | Antigravity | Documentation / DevOps | Viết script khởi động 5 service | (Xem chi tiết Prompt #12 mục 5) | `start-all.ps1` + startup-guide | Có | `startup-guide.md` |
| 45 | 25/06 | Antigravity | Report | Tổng hợp 4 file minh bạch AI | "Tổng hợp AI_AUDIT_LOG, PROMPTS, REFLECTION, CHANGELOG dựa trên các tài liệu thiết kế/debug thực tế của project, đảm bảo nhất quán chéo giữa 4 file" | 4 file hoàn chỉnh | Có | 4 file minh bạch AI |

---

## 5. Prompt chi tiết

> Các prompt dưới đây tương ứng trực tiếp với các entry trong `AI_AUDIT_LOG.md` (cùng số thứ
> tự Entry #1 – #12), được mở rộng đầy đủ ngữ cảnh, kết quả, và phần chỉnh sửa của sinh viên.

---

### Prompt số 1 — (↔ AI_AUDIT_LOG Entry #1)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 02/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Thiết kế Review/Approve flow cho AI Test Case Generation |
| Phần việc liên quan | Design / Backend / Frontend |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi giải thích / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Tôi đang xây dựng tính năng AI Gen TestCase cho DevTrackAI. Hiện tại AI chỉ gen 1 test case và
auto-fill vào form. Tôi muốn thay đổi:
1. AI gen nhiều test case (3-8 cases) thay vì 1
2. Có Review/Approve flow giống AiUseCaseGenerationModal
3. AI có thể tự chọn test type (UI/API/MANUAL) theo từng test case

Hãy phân tích source code hiện tại và đề xuất kiến trúc thay đổi backend + frontend cần thiết.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Tính năng AI Gen TestCase bản đầu chỉ tạo 1 test case/lần và không có bước kiểm duyệt, dẫn đến
kết quả không chính xác khi requirement phức tạp. Cần một luồng review giống tính năng AI Gen
UseCase đã có sẵn để tái sử dụng pattern quen thuộc trong hệ thống.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất: đổi return type sang List<TestCaseRequest>, lưu vào AiGenerationStaging (stage =
TEST_CASE), 3 endpoint mới (generate-ai / get / approve), component AiTestCaseReviewModal
3-panel, và state mới trong useTestCaseStore.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Toàn bộ kiến trúc 3 endpoint và cấu trúc staging được áp dụng. Component review modal được
dùng làm khung ban đầu cho AiTestCaseReviewModal.jsx.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Tự quyết định dùng AiGenerationStaging thay vì trả trực tiếp để không mất dữ liệu khi refresh.
- Phát hiện AI quên set projectId cho TestCase entity trong approveTestCaseGeneration().
- Tự thêm logic auto-increment tcCode (TC-1, TC-2...) mà AI bỏ sót.
- Refactor modal từ full-page sang fixed modal với overflow scroll do layout gốc vỡ trên màn
  hình nhỏ.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (thiếu projectId)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | AiGenerationService.java, TestCaseController.java, AiTestCaseReviewModal.jsx |
| Link tài liệu/báo cáo | AIGentestcase_plan.md |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #1 |

#### 5.8. Ghi chú thêm

```text
Follow-up: sau khi nhận kiến trúc, đã hỏi tiếp AI để refine phần map JsonNode → TestCase entity
(Prompt liên quan không liệt kê riêng, nằm trong cùng phiên làm việc).
```

---

### Prompt số 2 — (↔ AI_AUDIT_LOG Entry #2)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 15/05/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Thiết kế kiến trúc Async Test Execution (Kafka + Outbox + WebSocket) |
| Phần việc liên quan | Design / Backend |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi sinh code / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Tôi cần implement tính năng async test execution cho DevTrackAI, chuyển từ synchronous sang
fully async với Kafka + WebSocket realtime, xử lý race condition, semantic lỗi, và
multi-instance issues. Stack hiện tại là spring-boot-starter-webmvc. Trước khi viết code, hãy
định nghĩa đầy đủ state machine cho TestRun/TestExecution, schema Outbox event, và event
taxonomy WebSocket.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Luồng chạy test cũ đang block request HTTP trong lúc Playwright chạy (30s–3 phút), gây timeout
và trải nghiệm kém trên frontend. Cần chuyển toàn bộ sang mô hình bất đồng bộ trước khi mở rộng
thêm các tính năng khác (Local Agent, API Testing) dựa trên cùng nền tảng này.
```

#### 5.3. Kết quả AI trả về

```text
AI trả về state machine đầy đủ (PENDING/RUNNING/COMPLETED/FAILED/CANCELLED + isTerminal()
helper), thiết kế Outbox Pattern, WatchdogScheduler dùng ShedLock, và phân tách rõ Kafka
command (thin) với WebSocket event (rich).
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
State machine, Outbox Pattern và WatchdogScheduler được áp dụng gần như nguyên vẹn làm nền
tảng cho toàn bộ module Run TestCase, API Testing sau này.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Bổ sung xử lý case SKIPPED steps mà bản thiết kế đầu của AI chưa tính đến.
- Chỉnh lại idempotency trong receiveExecutionResult() để chịu được Kafka redelivery trùng lặp.
- Đơn giản hoá chiến lược DLQ/retry cho phù hợp hạ tầng Kafka single-broker của nhóm.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | SUPER_PROMPT_ASYNC_TEST_EXECUTION.md, TestRunService.java |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #2 |

#### 5.8. Ghi chú thêm

```text
Đây là prompt kiến trúc quan trọng nhất project — mọi module sau này (Local Agent, API Testing)
đều build trên state machine và Outbox Pattern từ session này.
```

---

### Prompt số 3 — (↔ AI_AUDIT_LOG Entry #3)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 20/05/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Debug lỗi Flyway/Hibernate khi thêm bảng test_runs/test_executions |
| Phần việc liên quan | Database / Debug |
| Mức độ sử dụng | Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Sau khi thêm bảng test_runs và test_executions qua Flyway, tôi gặp lỗi NOT NULL constraint
violation trên test_runs.started_at, lỗi Hibernate 7 vs PostgreSQL enum type mismatch trên
test_executions.environment, và lỗi type mismatch VARCHAR/BIGINT trên test_runs.id. Giải thích
nguyên nhân gốc từng lỗi và cách fix ở mức migration (không phải workaround trong code).
```

#### 5.2. Bối cảnh khi viết prompt

```text
Cả 3 lỗi xuất hiện gần như đồng thời khi chạy lại backend sau khi thêm entity mới cho luồng
async, gây khó xác định lỗi nào là nguyên nhân chính khiến ứng dụng không start được.
```

#### 5.3. Kết quả AI trả về

```text
AI xác định started_at nên nullable ở tầng DB (chỉ set khi RUNNING), Hibernate 7 cần khai báo
JDBC type tường minh cho enum, và đề xuất pattern migration an toàn (add nullable → backfill →
alter NOT NULL) thay vì ALTER phá huỷ.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng pattern migration 3 bước và khai báo JDBC type tường minh cho enum.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Tự kiểm tra type cột thực tế qua psql trước khi áp dụng fix, vì AI chỉ chẩn đoán dựa trên
  entity code được cung cấp.
- Viết migration mới thay vì sửa migration cũ để giữ lịch sử Flyway nhất quán, khác với đề xuất
  đầu tiên của AI.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | V*__async_flow.sql, TestRun.java, TestExecution.java |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #3 |

---

### Prompt số 4 — (↔ AI_AUDIT_LOG Entry #4)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 25/05/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Phân tích nguyên nhân 2 TestCase không chạy song song |
| Phần việc liên quan | Debug / Backend / Infrastructure |
| Mức độ sử dụng | Hỏi debug / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
2 test case chạy gần như cùng lúc đang bị xử lý tuần tự thay vì song song, dù có 3 worker
replicas và partitionsConsumedConcurrently = 3. Phân tích KafkaEventPublisher.java và worker.js,
giải thích chính xác nguyên nhân, xét đến Kafka partitioning, consumer group assignment, và
việc eachMessage() await toàn bộ test run.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Trong buổi demo thử, 2 sinh viên bấm Run gần như cùng lúc nhưng người thứ 2 phải chờ người thứ
nhất chạy xong hoàn toàn — không đúng như kỳ vọng về khả năng song song của kiến trúc Kafka.
```

#### 5.3. Kết quả AI trả về

```text
AI chỉ ra 3 nguyên nhân: (1) OutboxEvent publish không có key → round-robin → có thể rơi cùng
partition; (2) eachMessage() await toàn bộ khiến message cùng partition xử lý tuần tự; (3) dù
có 3 replicas, chúng chia sẻ chung 1 consumer group nên vẫn có thể rơi vào cùng 1 worker.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng giải pháp dùng testRunId làm Kafka key kết hợp semaphore giới hạn concurrency.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Thêm log tạm thời ghi partition-id để xác nhận thực nghiệm trước khi tin vào chẩn đoán của AI.
- Từ chối đề xuất đầu tiên của AI (fire-and-forget thuần) vì rủi ro quá tải, yêu cầu AI đưa ra
  bảng so sánh 3 giải pháp trước khi chọn phương án kết hợp key + semaphore.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | analysis_parallel_testrun_V6.md, KafkaEventPublisher.java |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #4 |

---

### Prompt số 5 — (↔ AI_AUDIT_LOG Entry #5)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 28/05/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Thiết kế DevTrack Local Agent |
| Phần việc liên quan | Design / Backend / Node.js |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Playwright worker của tôi chạy trên cloud nên không thể truy cập localhost:5173 trên máy
developer. Tôi muốn 1 "Local Agent" pattern giống BrowserStack Local Testing: cloud worker phát
hiện URL localhost, tạo task pending, và 1 CLI nhỏ polling trên máy developer nhận task, chạy
Playwright local, gửi kết quả về. Đề xuất AgentTask entity, các endpoint cần thiết, và cách
tích hợp vào testRunConsumer.js hiện tại mà không ảnh hưởng luồng URL public.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhiều bạn trong lớp phát triển ứng dụng đang test trên localhost, và nhu cầu chạy automated UI
test cho các app đó là có thật, trong khi hạ tầng Playwright Worker của DevTrack lại nằm trên
cloud/Docker.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất AgentTask entity (PENDING→CLAIMED→COMPLETED/FAILED/TIMEOUT), 4 endpoint nội bộ có
X-Internal-Service-Key, hàm isLocalUrl() routing, và package devtrack-agent CLI polling 3 giây
tái sử dụng executor.js sẵn có.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng gần như nguyên vẹn kiến trúc AgentTask và pattern routing isLocalUrl/delegateToLocalAgent.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Xác nhận với nhóm việc worker bị "giam" 5 phút/partition là chấp nhận được ở quy mô project,
  không nhận mặc định từ AI mà có cân nhắc thực tế.
- Chọn lưu agent_token trực tiếp trên Project entity (đơn giản hơn) thay vì tạo Entity riêng,
  sau khi so sánh 2 phương án AI đưa ra.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | devtrack_local_agent_prompt.md, implementation_plan_runtestcaseV1.md |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #5 |

---

### Prompt số 6 — (↔ AI_AUDIT_LOG Entry #6)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Implement vòng lặp polling + CDP screencast cho Agent CLI |
| Phần việc liên quan | Coding / Node.js |
| Mức độ sử dụng | Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Implement vòng lặp polling cho devtrack-agent/agent.js: poll GET /agent-tasks/pending mỗi 3
giây, auto-install Playwright Chromium nếu chưa có, chạy script nhận được qua executor.js, POST
kết quả về. Đồng thời relay live Chrome DevTools Protocol (CDP) screencast qua WebSocket để
frontend hiển thị video trực tiếp khi test local đang chạy.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Sau khi đã có thiết kế kiến trúc Local Agent (Prompt #5), cần bắt tay implement phần CLI thực
tế, bao gồm cả trải nghiệm xem trực tiếp giống luồng Cloud Worker đã có.
```

#### 5.3. Kết quả AI trả về

```text
AI sinh vòng lặp setInterval polling, try/catch quanh mỗi cycle, và pattern relay CDP
(Page.startScreencast → WebSocket frames theo room).
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Kiến trúc CDP stream qua WebSocket được áp dụng vào Playwright để truyền hình ảnh real-time về
Frontend thay vì phải chờ test chạy xong.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Tự fix lỗi AI ghi đè tham số envOverrides trong Node.js.
- Tự định tuyến lại WebSocket URL trong backend config (application.yaml) do AI tạo block
  duplicate.
- Sửa logic ghép roomId để tránh đụng độ giữa các Test Execution trong tương lai
  (testRunId-executionId).
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | devtrack-agent/agent.js, executor.js, application.yaml |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #6; CHANGELOG Phase 05 |

---

### Prompt số 7 — (↔ AI_AUDIT_LOG Entry #7)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 05/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Chẩn đoán mất screenshot evidence ở Local Agent |
| Phần việc liên quan | Debug / Backend |
| Mức độ sử dụng | Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Screenshot bị thiếu với các test run chạy qua Local Agent, dù executor.js có chụp file .png
trong lúc chạy Playwright. LocalTestRunWorker.java hiện đang đọc field evidenceUrls từ payload
kết quả của Agent. Phân tích sự không khớp giữa devtrack-agent/executor.js,
LocalTestRunWorker.java, và luồng Cloud Playwright, đề xuất fix không lưu chuỗi Base64 thẳng
vào PostgreSQL.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Sau khi triển khai Local Agent, phát hiện toàn bộ test run qua Agent đều không có ảnh minh
chứng khi xem lại lịch sử trên Frontend.
```

#### 5.3. Kết quả AI trả về

```text
AI xác định executor.js reset mảng screenshots về rỗng thay vì thu thập, và backend đọc sai
tên field. Đề xuất pipeline: Agent/Cloud gửi Base64 → Backend decode và upload Cloudinary →
chỉ lưu URL vào DB.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng toàn bộ pipeline decode-and-upload, thêm hàm storeBase64File trên FileStorageService.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Tự phát hiện luồng Cloud Playwright cũng bị lỗi field tương tự (executeViaPlaywrightService()),
  điều mà phân tích ban đầu của AI chưa bao quát hết.
- Đánh dấu rõ rủi ro phình DB nếu lưu Base64 trực tiếp, yêu cầu xác nhận hướng tiếp cận trước
  khi code thay vì chấp nhận ngay.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | implementation_plan_fix_Agent.md, LocalTestRunWorker.java |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #7 |

---

### Prompt số 8 — (↔ AI_AUDIT_LOG Entry #8)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 08/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Đánh giá và lập kế hoạch scale horizontal cho Playwright worker |
| Phần việc liên quan | Infrastructure / DevOps |
| Mức độ sử dụng | Hỏi review / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
Với worker.js hiện tại (consumer group "playwright-service-group", autoCommit false,
sessionTimeout 300000ms), đánh giá xem code đã thực sự sẵn sàng để scale horizontal chưa, và
lập kế hoạch theo giai đoạn (dev → Docker → Kubernetes + KEDA) kèm manifest cụ thể, giải thích
rõ những gì cần sửa trước khi deploy nhiều replicas.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Trước buổi thuyết trình, muốn có câu trả lời thuyết phục cho câu hỏi "hệ thống có scale được
không" dựa trên thiết kế thực tế, thay vì chỉ nói suông.
```

#### 5.3. Kết quả AI trả về

```text
AI xác nhận thiết kế cơ bản đã sẵn sàng scale (stateless, chung consumer group, autoCommit
false, auto-reconnect), nhưng cảnh báo sessionTimeout=300000ms quá cao và clientId trùng nhau
là rủi ro khi monitor. Sinh Deployment YAML và KEDA ScaledObject theo Kafka lag.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Dùng làm tài liệu phân tích/kế hoạch scale (chưa deploy K8s thật do không có cluster).
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Tính lại công thức scale của KEDA theo tải thực tế ước lượng của lớp học (~30 sinh viên) để
  kiểm tra maxReplicaCount hợp lý, không dùng số AI đề xuất mặc định.
- Đối chiếu khuyến nghị sessionTimeout với phân tích ở Prompt #4 để đảm bảo nhất quán giữa 2
  session AI khác nhau.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | scale-horizontal-kubernetes.md |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #8; chỉ dừng ở mức tài liệu |

---

### Prompt số 9 — (↔ AI_AUDIT_LOG Entry #9)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 10/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Thiết kế backend module API Testing |
| Phần việc liên quan | Design / Backend |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Thiết kế module API Testing kiểu Postman cho DevTrackAI: test case có method/URL/headers/body/
assertions, environment có variables, chạy trực tiếp cho URL public, và delegate qua cơ chế
AgentTask/Local Agent sẵn có cho URL localhost. Stack là spring-boot-starter-webmvc (không có
WebFlux). Đề xuất schema, luồng thực thi cho cả 2 trường hợp, và cách tránh circular dependency
giữa ApiTestExecutorService và AgentTaskService.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Muốn tái sử dụng tối đa hạ tầng AgentTask đã xây cho UI Testing, thay vì viết lại toàn bộ cơ
chế delegate cho localhost riêng cho API Testing.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất 3 bảng (api_environment, api_test_case, api_test_result), thread pool riêng
apiTestExecutor, RestTemplate trực tiếp cho URL public, tái sử dụng AgentTaskService cho URL
private, và dùng ApplicationEventPublisher (ApiTestJobCompletedEvent) để né circular dependency.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng schema 3 bảng, pattern Spring Event, và thread pool riêng.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Yêu cầu AI sửa lại bản thiết kế đầu (ApiTestExecutorService gọi trực tiếp AgentTaskService —
  rủi ro circular dependency thật khi AgentTaskService cần gọi ngược lại để evaluate) — có ghi
  rõ trong bảng "Tóm tắt thay đổi mới nhất" của kế hoạch.
- Thêm fallback taskType mặc định "PLAYWRIGHT" trong AgentTask.builder() để không phá vỡ luồng
  Local Agent UI Testing cũ.
- Định nghĩa chuẩn response HTTP 200 + {status: PENDING}, khác với đề xuất 202 ban đầu của AI,
  để nhất quán với cách luồng Local Agent UI Testing hiện có báo hiệu "đang chờ".
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (circular dependency)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | TTapi_testing_implementation_plan.md, ApiTestExecutorService.java |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #9 |

---

### Prompt số 10 — (↔ AI_AUDIT_LOG Entry #10)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Thiết kế UI split-pane cho module API Testing |
| Phần việc liên quan | Frontend / UI Design |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Thiết kế màn hình API Testing cho DevTrackAI theo phong cách "Tactical Telemetry": mật độ dữ
liệu cao, layout split-pane giống Postman, font monospace cho JSON/headers/URL, transition tối
thiểu, nút bấm phẳng contrast cao. Đề xuất component tree, cấu trúc Zustand store, và cách dọn
dẹp polling kết quả PENDING (Local Agent) để tránh memory leak.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Sau khi có backend API Testing (Prompt #9), cần thiết kế UI phù hợp với đối tượng dev/tester
quen thuộc với Postman, đồng thời tránh trùng lặp state với useTestCaseStore đã khá lớn.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất ApiTestPage (sidebar list + main workspace), ApiTestCaseDetail chia Request
Builder/Response Viewer, store useApiTestStore riêng, và cặp runApiTest()/stopPolling() lưu
intervalId trong Zustand.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng cấu trúc trang tổng thể (25% sidebar/75% workspace) và store riêng useApiTestStore.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Yêu cầu bổ sung gọi stopPolling() cả ở useEffect cleanup lẫn trước khi trigger run mới, sau
  khi nhận ra bản đầu của AI chỉ xử lý case cleanup mà bỏ sót case user bấm Run lại quá nhanh.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | UI_API_TESTING_PLAN, useApiTestStore.js |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #10 |

---

### Prompt số 11 — (↔ AI_AUDIT_LOG Entry #11)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 14/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Redesign UI Design System từ Indigo/Purple sang Teal |
| Phần việc liên quan | Frontend / UI Design |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Thay toàn bộ màu indigo/purple trong global.css, tailwind.config.js, Sidebar.jsx,
TopNavBar.jsx, TestCaseDetailPage.jsx bằng bảng màu teal enterprise lấy cảm hứng từ
Linear/Stripe/Vercel. Giữ nguyên animation sliding pill kiểu iOS của nav item và nút primary 3D
đang có, chỉ đổi màu sắc/shadow/gradient. Liệt kê đầy đủ từng token thay đổi.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Theme purple/indigo cũ bị nhận xét là thiếu chiều sâu (monochromatic), cần một theme chuyên
nghiệp hơn cho buổi demo cuối kỳ mà không phải viết lại toàn bộ animation/interaction đã hoạt
động tốt.
```

#### 5.3. Kết quả AI trả về

```text
AI trả về bảng token đầy đủ (Primary #1E707D, Primary Hover #278A99, Primary Dark #165964,
Accent Glow #4EC6D8, cùng các màu semantic) và map từng token vào CSS variable, Tailwind
config, style component cụ thể.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng toàn bộ bảng token và hệ thống shadow vào global.css, tailwind.config.js, và các
component layout.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Tự kiểm tra contrast text-trên-primary và màu badge sau khi đổi theme, vì bảng token AI đưa
  ra không kèm accessibility check.
- Yêu cầu AI chỉnh lại bản đầu (nhìn phẳng, thiếu chiều sâu) bằng cách thêm tầng shadow
  "Card hover" riêng để khôi phục depth hierarchy.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | UI.md, global.css, tailwind.config.js |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #11 |

---

### Prompt số 12 — (↔ AI_AUDIT_LOG Entry #12)

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 20/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Viết script khởi động 5 service theo đúng thứ tự phụ thuộc |
| Phần việc liên quan | Documentation / DevOps |
| Mức độ sử dụng | Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Viết script start-all.ps1 khởi động Kafka (docker compose), Playwright HTTP server, Playwright
Kafka worker, Spring Boot backend, và React frontend, mỗi service trong 1 cửa sổ terminal
riêng, có đủ độ trễ giữa các bước để tôn trọng thứ tự phụ thuộc (Kafka → Playwright Server →
Worker → Backend → Frontend). Viết kèm hướng dẫn khởi động thủ công làm phương án dự phòng.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Việc mở tay 5 terminal mỗi lần dev tốn thời gian và dễ quên thứ tự, đặc biệt gây lỗi kết nối
nếu backend khởi động trước khi Kafka sẵn sàng.
```

#### 5.3. Kết quả AI trả về

```text
AI sinh script PowerShell mở 4 cửa sổ terminal với Start-Sleep so le, kèm file hướng dẫn thủ
công (Terminal 1-5, thứ tự bắt buộc, lệnh tắt hệ thống, ghi chú EADDRINUSE).
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Dùng làm script khởi động hằng ngày trong quá trình dev/demo.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
- Tự điều chỉnh giá trị delay sau khi test trên máy dev thật, vì delay mặc định của AI chưa đủ
  để Kafka sẵn sàng trước khi backend cố kết nối.
- Tự thêm bước troubleshooting taskkill /F /IM node.exe dựa trên lỗi EADDRINUSE thực tế gặp
  phải, không phải do AI gợi ý.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | start-all.ps1, startup-guide.md |
| Ghi chú khác | Đối chiếu AI_AUDIT_LOG.md Entry #12 |

---

## 6. Prompt quan trọng nhất

### 6.1. Prompt được chọn

```text
Prompt số 2 — "Tôi cần implement tính năng async test execution cho DevTrackAI chuyển từ
synchronous sang fully async với Kafka + WebSocket realtime, xử lý race condition, semantic
lỗi, và multi-instance issues."
```

### 6.2. Vì sao prompt này quan trọng?

```text
Đây là prompt kiến trúc nền tảng — toàn bộ các module xây dựng sau này (Local Agent, API
Testing, AI Gen TestCase review flow) đều tái sử dụng trực tiếp state machine, Outbox Pattern,
và cơ chế WebSocket event được định nghĩa từ session này. Nếu thiết kế ban đầu sai, chi phí sửa
lại ở các module phụ thuộc sẽ rất lớn.
```

### 6.3. Kết quả prompt này mang lại

```text
Một state machine đầy đủ và nhất quán cho TestRun/TestExecution, cơ chế Outbox tách biệt DB
write khỏi Kafka publish, và WatchdogScheduler tự phục hồi run bị treo — toàn bộ được dùng
xuyên suốt project.
```

### 6.4. Sinh viên/nhóm đã kiểm tra kết quả như thế nào?

```text
Đối chiếu state machine với các kịch bản lỗi thực tế của Playwright (step SKIPPED), test thủ
công luồng Cancel/Watchdog, và kiểm tra hành vi khi giả lập Kafka gửi trùng message
(idempotency).
```

### 6.5. Sinh viên/nhóm đã cải tiến gì từ kết quả AI?

```text
Bổ sung xử lý SKIPPED steps, làm chặt lại idempotency cho receiveExecutionResult(), và đơn
giản hoá chiến lược DLQ cho phù hợp hạ tầng Kafka single-broker thực tế của nhóm.
```

---

## 7. Prompt chưa hiệu quả

### 7.1. Prompt chưa hiệu quả

```text
"Design a Postman-style API Testing module for DevTrackAI" (phiên bản rút gọn, không kèm chi
tiết stack spring-boot-starter-webmvc và không yêu cầu tránh circular dependency ngay từ đầu)
```

### 7.2. Vì sao prompt này chưa hiệu quả?

```text
Vì thiếu ràng buộc kỹ thuật cụ thể (stack không có WebFlux) và không nêu rõ yêu cầu tránh
circular dependency, AI đưa ra bản thiết kế đầu tiên cho ApiTestExecutorService gọi trực tiếp
AgentTaskService — một thiết kế sẽ gây circular dependency thật khi AgentTaskService cần gọi
ngược lại để đánh giá kết quả.
```

Nguyên nhân chính:
- Thiếu ràng buộc kỹ thuật (stack, giới hạn kiến trúc hiện có).
- Không nêu rõ yêu cầu đầu ra (phải né circular dependency).

### 7.3. Cách cải thiện prompt

```text
Bổ sung rõ: stack công nghệ hiện tại, ràng buộc kiến trúc không được vi phạm (không circular
dependency giữa 2 service cụ thể), và yêu cầu AI liệt kê rủi ro trước khi đề xuất giải pháp.
```

### 7.4. Prompt sau khi cải tiến

```text
Chính là Prompt số 9 (mục 5) — có nêu rõ stack spring-boot-starter-webmvc và yêu cầu tường minh
"đề xuất cách tránh circular dependency giữa ApiTestExecutorService và AgentTaskService".
```

### 7.5. Kết quả sau khi cải tiến prompt

```text
AI đề xuất ngay pattern ApplicationEventPublisher (Spring Event) để decouple 2 service, tránh
được rủi ro circular dependency ngay từ vòng đề xuất đầu tiên.
```

---

## 8. Bài học về cách viết prompt

### 8.1. Khi viết prompt, em/nhóm cần cung cấp thông tin gì để AI trả lời tốt hơn?

```text
- Stack công nghệ chính xác (ví dụ: spring-boot-starter-webmvc, không có WebFlux) để AI không
  đề xuất giải pháp không tương thích (Mono/Flux).
- Các ràng buộc kiến trúc hiện có không được phá vỡ (ví dụ: không đổi flow cho URL public khi
  thêm Local Agent).
- Yêu cầu rõ AI liệt kê rủi ro/trade-off thay vì chỉ đưa 1 giải pháp duy nhất.
```

### 8.2. Em/nhóm đã học được gì về cách đặt câu hỏi cho AI?

```text
Prompt càng nêu rõ ràng buộc thực tế (stack, quy mô hạ tầng, các phần không được sửa) thì AI
càng ít đưa ra giải pháp "đẹp trên lý thuyết" nhưng không khớp với dự án thật. Prompt yêu cầu
AI "phân tích trước khi đề xuất" (ví dụ Prompt #2, #4) cho kết quả có chiều sâu hơn hẳn so với
prompt yêu cầu AI "làm luôn".
```

### 8.3. Lần sau em/nhóm sẽ cải thiện prompt như thế nào?

```text
Luôn đính kèm đoạn code hiện tại liên quan trực tiếp thay vì mô tả bằng lời, và luôn yêu cầu AI
nêu rõ rủi ro/đánh đổi của từng phương án trước khi chọn, thay vì chỉ nhận 1 giải pháp và áp
dụng ngay.
```

---

## 9. Phân loại prompt đã sử dụng

| Loại prompt | Số lượng | Ví dụ prompt tiêu biểu |
|---|---:|---|
| Prompt phân tích yêu cầu | 4 | #1, #2, #3, #5 (mục 4) — Business Goals, Feature Inventory |
| Prompt giải thích kiến thức | 2 | #9, #14 (mục 4) — Outbox Pattern, xác thực nội bộ |
| Prompt thiết kế giải pháp | 10 | #8, #10, #20, #32, #35, #39 (mục 4) |
| Prompt thiết kế database | 5 | #12, #13, #21, #24 trong bảng liên quan |
| Prompt sinh code mẫu | 8 | #19, #24, #27, #30, #33, #34, #37, #41 |
| Prompt debug lỗi | 6 | #12, #17, #29, #40 |
| Prompt viết test case | 1 | #31 — checklist kiểm thử thủ công |
| Prompt review code | 4 | #16, #18, #28, #36 |
| Prompt tối ưu code | 3 | #18, #26, #33 |
| Prompt viết báo cáo | 2 | #45 |
| Prompt chuẩn bị thuyết trình | 0 | (chưa thực hiện) |
| Prompt khác (UI/UML) | 5 | #7, #23, #39, #42, #43 |

---

## 10. Checklist chất lượng prompt

| Tiêu chí | Đã đạt? | Ghi chú |
|---|:---:|---|
| Prompt có mục tiêu rõ ràng | x | |
| Prompt có đủ bối cảnh | x | Đa số có kèm tên file/service liên quan |
| Prompt có nêu công nghệ/ngôn ngữ sử dụng | x | Đặc biệt quan trọng ở các prompt kiến trúc |
| Prompt có nêu yêu cầu đầu ra | x | |
| Prompt không yêu cầu AI làm toàn bộ bài một cách máy móc | x | Luôn yêu cầu phân tích trước khi đề xuất |
| Prompt có yêu cầu AI giải thích hoặc phân tích | x | Đặc biệt ở các prompt debug (#3, #4, #7) |
| Kết quả AI được kiểm tra lại | x | Xem cột "Phần chỉnh sửa" ở mục 5 |
| Kết quả AI được chỉnh sửa trước khi sử dụng | x | |
| Prompt quan trọng được ghi lại đầy đủ | x | Mục 6 |
| Prompt sai/chưa hiệu quả được rút kinh nghiệm | x | Mục 7 |

---

## 11. Cam kết sử dụng prompt minh bạch

Sinh viên/nhóm cam kết rằng:

- Các prompt quan trọng đã được ghi lại trung thực.
- Không che giấu việc sử dụng AI trong các phần quan trọng của bài.
- Không nộp nguyên văn kết quả AI nếu chưa kiểm tra và chỉnh sửa.
- Có khả năng giải thích các phần đã sử dụng từ AI.
- Chịu trách nhiệm với sản phẩm cuối cùng.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Phạm Duy Hưng | 30/06/2026 |
