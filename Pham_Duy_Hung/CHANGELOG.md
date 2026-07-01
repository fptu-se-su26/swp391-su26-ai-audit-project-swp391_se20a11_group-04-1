# Changelog

## 1. Quy định ghi Changelog

File này dùng để ghi lại các thay đổi quan trọng trong quá trình thực hiện bài tập, lab, assignment hoặc project.

Nguyên tắc ghi changelog:

- Chỉ ghi những gì đã hoàn thành thật sự.
- Không ghi kế hoạch nếu chưa thực hiện.
- Mỗi thay đổi nên có ngày, nội dung, người thực hiện và minh chứng.
- Nếu có AI hỗ trợ, cần ghi rõ AI đã hỗ trợ phần nào.
- Nếu có commit GitHub, cần ghi rõ tên file/module thay đổi (repo private, không đính kèm link công khai).
- Nếu có lỗi đã sửa, cần ghi rõ lỗi, nguyên nhân và cách xử lý.

---

## 2. Thông tin project

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
| Repository URL | (private repo nội bộ nhóm) |
| Ngày bắt đầu | 01/05/2026 |
| Ngày hoàn thành | 30/06/2026 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 01/05 – 03/05 | Khởi tạo project, cấu trúc thư mục | Completed |
| Phase 02 | 04/05 – 10/05 | Phân tích yêu cầu, SRS, screen inventory | Completed |
| Phase 03 | 11/05 – 24/05 | Thiết kế kiến trúc async, DB schema, UI design system | Completed |
| Phase 04 | 25/05 – 15/06 | Implementation: Run TestCase, Local Agent, AI Gen TestCase, API Testing | Completed |
| Phase 05 | 05/06 – 24/06 | Testing & Debug: Kafka partition, screenshot fix, K8s scaling | In Progress |
| Phase 06 | 25/06 – 30/06 | Hoàn thiện báo cáo và demo | In Progress |

---

# [Phase 01] Khởi tạo project

## Ngày thực hiện

```text
01/05/2026 - 03/05/2026
```

## Đã hoàn thành

- [x] Tạo repository
- [x] Tạo cấu trúc thư mục project (backend / playwright-service / frontend / devtrack-agent)
- [x] Tạo file README.md
- [x] Tạo thư mục `docs/`
- [x] Tạo file `AI_AUDIT_LOG.md`
- [x] Tạo file `PROMPTS.md`
- [x] Tạo file `REFLECTION.md`
- [x] Tạo file `CHANGELOG.md`
- [x] Khởi tạo source code ban đầu (Spring Boot backend, React frontend, Node.js Playwright service)
- [x] Cài đặt thư viện/công cụ cần thiết
- [x] Cấu hình môi trường chạy project (PostgreSQL, Docker, Kafka)

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Khởi tạo Spring Boot project + cấu trúc package (controller/service/repository/entity/dto) | Hưng | `backend/` | Cấu trúc thư mục project |
| 2 | Khởi tạo React (Vite) project, cấu hình Tailwind | Hưng | `frontend/` | `tailwind.config.js` |
| 3 | Khởi tạo Playwright Service (Node.js) với KafkaJS | Hưng | `playwright-service/` | `worker.js`, `server.js` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ đề xuất cấu trúc thư mục ban đầu cho hệ 3 service (Spring Boot + Node.js Playwright
Service + React), dựa trên convention phổ biến của các dự án tương tự. Việc lựa chọn cuối
cùng và điều chỉnh theo quy mô thực tế của nhóm do sinh viên quyết định.
```

## Commit/Screenshot minh chứng

```text
Cấu trúc thư mục gốc: code/backend, code/playwright-service, code/frontend,
code/devtrack-agent (thêm ở Phase 04).
```

## Ghi chú

```text
Không có gì đặc biệt ở giai đoạn này.
```

---

# [Phase 02] Phân tích yêu cầu

## Ngày thực hiện

```text
04/05/2026 - 10/05/2026
```

## Đã hoàn thành

- [x] Xác định problem statement
- [x] Xác định user roles
- [x] Viết user stories
- [x] Viết use cases
- [x] Xác định functional requirements
- [x] Xác định non-functional requirements
- [x] Xác định business rules
- [x] Xác định acceptance criteria
- [ ] Review yêu cầu với giảng viên/nhóm
- [ ] Chỉnh sửa yêu cầu sau feedback

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết Project Overview, Business Goals, User Roles trong SRS | Hưng | `SRS.md` (Phase 1) | Mục 1.1 – 1.10 |
| 2 | Lập Feature Inventory + Screen Inventory | Hưng | `SRS.md` (Phase 2, 3) | Danh sách SCR-01 đến SCR-xx |
| 3 | Viết Screen Specification chi tiết (trigger, actor, API calls, business rules, flows) cho từng màn hình | Hưng | `SRS.md` (Phase 4) | SCR-01 LoginPage, SCR-02 RegisterPage, SCR-03 DashboardPage, SCR-04 ProjectDashboardPage, SCR-05 RequirementsPage... |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ dựng khung mẫu (template) cho từng Screen Specification (Function Trigger, Actors,
API Calls, Database Entities, Business Rules, Validation, Normal/Alternative/Abnormal Flow) để
đảm bảo tính nhất quán giữa các màn hình. Nội dung nghiệp vụ cụ thể của từng màn hình do sinh
viên điền dựa trên thiết kế thực tế của hệ thống.
```

## Commit/Screenshot minh chứng

```text
File SRS.md — hơn 20 màn hình được đặc tả theo cùng một khung mẫu thống nhất.
```

## Ghi chú

```text
Phần review với giảng viên và chỉnh sửa sau feedback chưa thực hiện tại thời điểm ghi log này.
```

---

# [Phase 03] Thiết kế hệ thống

## Ngày thực hiện

```text
11/05/2026 - 24/05/2026
```

## Đã hoàn thành

- [x] Thiết kế kiến trúc tổng quan
- [x] Thiết kế database/ERD
- [x] Thiết kế API
- [x] Thiết kế giao diện/wireframe
- [x] Thiết kế flow xử lý
- [ ] Thiết kế class diagram
- [x] Thiết kế sequence diagram
- [ ] Thiết kế security/authorization flow (chi tiết)
- [ ] Review thiết kế
- [ ] Chỉnh sửa thiết kế sau feedback

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Thiết kế state machine đầy đủ cho TestRun/TestExecution (PENDING → RUNNING → COMPLETED/FAILED/CANCELLED) | Hưng | `SUPER_PROMPT_ASYNC_TEST_EXECUTION.md` | Mục 6 — State Machine |
| 2 | Thiết kế kiến trúc async: Outbox Pattern + Kafka + WebSocket thay cho luồng đồng bộ cũ | Hưng | `TestRunService.java`, `OutboxEvent` entity | Mục 5, 7, 8 — Kiến trúc mục tiêu |
| 3 | Thiết kế schema database cho `test_runs`, `test_executions` (Flyway) | Hưng | `V*__async_flow.sql` | Migration files |
| 4 | Thiết kế kiến trúc Local Agent (AgentTask entity, 4 endpoint nội bộ, polling CLI) | Hưng | `devtrack_local_agent_prompt.md`, `implementation_plan_runtestcaseV1.md` | Sequence diagram Local Agent flow |
| 5 | Thiết kế schema + kiến trúc backend cho module API Testing (Postman-style, Local Agent delegation) | Hưng | `TTapi_testing_implementation_plan.md` | 3 bảng: api_environment, api_test_case, api_test_result |
| 6 | Thiết kế lại UI Design System toàn cục: đổi theme Indigo/Purple → Teal Enterprise | Hưng | `UI.md` | Bảng token màu, shadow system |
| 7 | Thiết kế UI Split-pane kiểu Postman cho module API Testing | Hưng | `UI_API_TESTING_PLAN` | ApiTestPage, ApiTestCaseDetail |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ nhiều nhất ở giai đoạn này: đề xuất state machine, Outbox Pattern, schema Flyway,
kiến trúc Local Agent, kiến trúc API Testing (Spring Event để né circular dependency), và
bảng token màu cho UI Design System. Toàn bộ các đề xuất đều được sinh viên đối chiếu lại với
constraint thực tế của dự án (stack hiện có, quy mô lớp học, hạ tầng Kafka single-broker)
trước khi chốt thiết kế cuối cùng — chi tiết xem AI_AUDIT_LOG.md Entry #2, #5, #9, #11.
```

## Commit/Screenshot minh chứng

```text
SUPER_PROMPT_ASYNC_TEST_EXECUTION.md, devtrack_local_agent_prompt.md,
TTapi_testing_implementation_plan.md, UI.md, UI_API_TESTING_PLAN — dùng làm tài liệu hợp đồng
thiết kế (design contract) trước khi code.
```

## Ghi chú

```text
Class diagram chi tiết và security/authorization flow đầy đủ chưa được vẽ chính thức, chỉ mới
thể hiện rải rác qua entity code và migration.
```

---

# [Phase 04] Implementation

## Ngày thực hiện

```text
25/05/2026 - 15/06/2026
```

## Đã hoàn thành

- [x] Tạo project structure
- [x] Cài đặt database connection
- [x] Xây dựng backend
- [x] Xây dựng frontend
- [ ] Xây dựng authentication/authorization (đã có, chưa audit riêng trong log này)
- [x] Xử lý CRUD
- [x] Xử lý validation
- [x] Tích hợp API
- [x] Xử lý upload/download file (screenshot evidence qua Cloudinary)
- [x] Xử lý lỗi
- [x] Tối ưu giao diện
- [x] Cập nhật README hướng dẫn chạy

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Implement luồng Run TestCase bất đồng bộ end-to-end: Backend → Kafka → Playwright Service → Chromium, callback kết quả về Backend | Hưng | `testRunConsumer.js`, `TestRunService.java` | `CAU_TRUC_RUN_TESTCASE.md` |
| 2 | Implement tính năng AI Gen TestCase với Review/Approve flow, multi-testcase, AI Smart Type | Hưng | `AiGenerationService.java`, `AiTestCaseReviewModal.jsx` | `AIGentestcase_plan.md` |
| 3 | Implement Local Agent: AgentTask entity, 4 endpoint nội bộ, `devtrack-agent` CLI polling | Hưng | `AgentTask.java`, `devtrack-agent/agent.js` | `implementation_plan_runtestcaseV1.md` |
| 4 | Implement CDP Screencast live stream qua WebSocket cho cả luồng Cloud và Local Agent | Hưng | `devtrack-agent/agent.js`, WebSocket relay | Log console "Consumer has joined the group" |
| 5 | Implement module API Testing (backend): `ApiTestExecutorService`, `AssertionEvaluatorService`, `AiApiTestGeneratorService` (Gemini) | Hưng | `TTapi_testing_implementation_plan.md` Phase 1–8 | `ApiTestController.java` |
| 6 | Implement UI module API Testing (split-pane, polling PENDING) | Hưng | `useApiTestStore.js`, `ApiTestCaseDetail.jsx` | `UI_API_TESTING_PLAN` |
| 7 | Redesign toàn bộ UI theme sang Teal (`global.css`, `tailwind.config.js`, `Sidebar.jsx`, `TopNavBar.jsx`, `TestCaseDetailPage.jsx`) | Hưng | Frontend styles | `UI.md` |
| 8 | Viết script `start-all.ps1` và `startup-guide.md` để khởi động 5 service theo đúng thứ tự phụ thuộc | Hưng | `start-all.ps1` | `startup-guide.md` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ sinh code khung (controller, service skeleton, component skeleton) cho từng tính
năng lớn (AI Gen TestCase, Local Agent, API Testing, UI theme). Trong mọi trường hợp, sinh
viên tự review và sửa lại các lỗi implementation cụ thể (thiếu projectId, sai field
evidenceUrls/screenshots, tham số envOverrides bị ghi đè, YAML bị duplicate...). Chi tiết xem
AI_AUDIT_LOG.md Entry #1, #5, #6, #7, #9, #10.
```

## Commit/Screenshot minh chứng

```text
Tham chiếu các file: AiGenerationService.java, AgentTask.java, devtrack-agent/agent.js,
ApiTestExecutorService.java, useApiTestStore.js, global.css, start-all.ps1.
```

## Ghi chú

```text
Authentication/authorization đã tồn tại từ trước Phase 04 (không thuộc phạm vi các tính năng
mới ghi trong log này) nên chưa liệt kê chi tiết thay đổi riêng.
```

---

# [Phase 05] Testing & Debug

## Ngày thực hiện

```text
05/06/2026 - 24/06/2026 (đang tiếp tục)
```

## Đã hoàn thành

- [x] Tích hợp CDP Screencast Live Stream cho Local Agent
- [x] Fix lỗi YAML Config Override
- [x] Fix lỗi Playwright Script Parameter Crash
- [ ] Viết test case (unit/integration test tự động)
- [x] Chạy test chức năng chính (thủ công: Run TestCase, AI Gen TestCase, Local Agent, API Testing)
- [x] Kiểm tra output
- [ ] Kiểm tra validation (toàn diện)
- [ ] Kiểm tra lỗi giao diện (toàn diện)
- [x] Kiểm tra lỗi database (Flyway/Hibernate)
- [ ] Kiểm tra phân quyền
- [ ] Kiểm tra bảo mật cơ bản
- [x] Fix bug
- [x] Chạy lại sau khi fix bug
- [x] Ghi nhận kết quả test

## Danh sách lỗi đã xử lý

| STT | Lỗi phát hiện | Nguyên nhân | Cách xử lý | Trạng thái |
|---:|---|---|---|---|
| 1 | `NOT NULL` constraint violation trên `test_runs.started_at` | Cột được set NOT NULL từ migration ban đầu nhưng giá trị chỉ được gán khi TestRun chuyển sang RUNNING | Sửa migration để cột nullable ở thời điểm tạo, chỉ set giá trị khi cập nhật status RUNNING | Fixed |
| 2 | Hibernate 7 vs PostgreSQL enum type conflict trên `test_executions.environment` | Hibernate 7 siết chặt việc bind enum, không tự khớp với PostgreSQL native enum như trước | Thêm khai báo JDBC type/columnDefinition tường minh cho field enum | Fixed |
| 3 | `test_runs.id` type mismatch (VARCHAR vs BIGINT) | Entity khai báo kiểu khác với cột thực tế trong DB do migration cũ để lại | Viết migration mới (không sửa migration cũ) để chuẩn hoá kiểu BIGINT xuyên suốt entity/repository/FK | Fixed |
| 4 | 2 TestCase chạy gần như cùng lúc bị xử lý tuần tự thay vì song song | OutboxEvent publish không có Kafka key → round-robin → có thể rơi cùng partition; `eachMessage` await toàn bộ test run | Thêm `testRunId` làm Kafka key + semaphore giới hạn concurrency trong worker | Fixed |
| 5 | Screenshot evidence bị mất với các Test Run chạy qua Local Agent | `LocalTestRunWorker.java` đọc nhầm field `evidenceUrls` thay vì `screenshots` (Base64); `executor.js` phía Agent không thu thập ảnh từ tempDir | Agent thu thập ảnh → gửi Base64 → Backend decode và upload lên Cloudinary qua `storeBase64File()`, chỉ lưu URL vào DB | Fixed |
| 6 | `EADDRINUSE :::4001` khi khởi động lại Playwright Server | Tiến trình `node server.js` cũ chưa bị kill hoàn toàn ở lần chạy trước | Thêm bước `taskkill /F /IM node.exe` vào startup-guide.md như bước troubleshooting chuẩn | Fixed |
| 7 | Kafka `sessionTimeout` 5 phút khiến failover chậm khi worker crash | Giá trị mặc định 300000ms quá cao cho quy mô dự án | Đề xuất giảm còn 30000ms trong kế hoạch scale (chưa deploy K8s thật để verify) | Pending |

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Thêm partition-id logging tạm thời để xác nhận nguyên nhân xử lý tuần tự trước khi áp dụng fix | Hưng | `worker.js` | `analysis_parallel_testrun_V6.md` |
| 2 | Viết `scale-horizontal-kubernetes.md` làm tài liệu phân tích khả năng scale dựa trên source code hiện tại | Hưng | `worker.js`, `KafkaEventPublisher.java` | Mục 5 — Điều kiện để scale hoạt động đúng |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ chẩn đoán nguyên nhân gốc cho các lỗi phức tạp liên quan đến hệ phân tán (Kafka
partitioning, Hibernate 7 enum binding), nhưng việc xác nhận thực nghiệm (thêm log, chạy lại,
đối chiếu kết quả) và quyết định giải pháp cuối cùng (ví dụ chọn "key + semaphore" thay vì
"fire-and-forget" đơn thuần) đều do sinh viên thực hiện. Chi tiết xem AI_AUDIT_LOG.md Entry #3,
#4, #7, #8.
```

## Commit/Screenshot minh chứng

```text
analysis_parallel_testrun_V6.md, implementation_plan_fix_Agent.md,
scale-horizontal-kubernetes.md — các tài liệu phân tích lỗi kèm giải pháp đã áp dụng.
```

## Ghi chú

```text
Unit/integration test tự động, kiểm tra phân quyền và bảo mật cơ bản vẫn chưa được thực hiện
đầy đủ tính đến thời điểm ghi log này — được liệt kê rõ trong mục 4.2 "Các chức năng chưa hoàn
thành" bên dưới.
```

---

# [Phase 06] Hoàn thiện báo cáo và demo

## Ngày thực hiện

```text
25/06/2026 - 30/06/2026
```

## Đã hoàn thành

- [ ] Hoàn thiện source code
- [x] Hoàn thiện README.md / startup-guide.md
- [ ] Hoàn thiện report
- [ ] Hoàn thiện slide
- [ ] Hoàn thiện video demo
- [x] Kiểm tra lại `AI_AUDIT_LOG.md`
- [x] Kiểm tra lại `PROMPTS.md`
- [x] Hoàn thiện `REFLECTION.md`
- [x] Kiểm tra lại `CHANGELOG.md`
- [ ] Đóng gói bài nộp

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Tổng hợp và điền đầy đủ 4 file minh bạch AI (AI_AUDIT_LOG, PROMPTS, REFLECTION, CHANGELOG) dựa trên các tài liệu thiết kế/implementation thực tế của project | Hưng | `AI_AUDIT_LOG.md`, `PROMPTS.md`, `REFLECTION.md`, `CHANGELOG.md` | Toàn bộ 4 file |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ tổng hợp và trình bày lại nội dung các file minh bạch AI dựa trên các tài liệu thiết
kế/implementation mà sinh viên đã tạo ra trong suốt project (SRS, kế hoạch kiến trúc, phân
tích lỗi). Sinh viên là người xác nhận tính chính xác của nội dung so với công việc thực tế đã
làm trước khi nộp.
```

## Commit/Screenshot minh chứng

```text
4 file AI_AUDIT_LOG.md, PROMPTS.md, REFLECTION.md, CHANGELOG.md sau khi hoàn thiện.
```

## Ghi chú

```text
Report, slide và video demo chưa hoàn thiện tại thời điểm ghi log này.
```

---

# 4. Tổng kết thay đổi cuối project

## 4.1. Các chức năng đã hoàn thành

| STT | Chức năng | Trạng thái | Minh chứng | Ghi chú |
|---:|---|---|---|---|
| 1 | Run TestCase bất đồng bộ (Kafka + Outbox + WebSocket) | Completed | `CAU_TRUC_RUN_TESTCASE.md` | Bao gồm cả luồng Cloud và Local Agent |
| 2 | AI Gen TestCase — Review/Approve, multi-testcase, AI Smart Type | Completed | `AIGentestcase_plan.md` | |
| 3 | DevTrack Local Agent (CLI polling cho localhost testing) | Completed | `devtrack_local_agent_prompt.md` | Kèm CDP screencast live stream |
| 4 | Screenshot evidence qua Cloudinary (Base64 → URL) | Completed | `implementation_plan_fix_Agent.md` | Áp dụng cho cả Cloud và Local flow |
| 5 | Module API Testing (backend: executor, assertion, AI generator) | Completed | `TTapi_testing_implementation_plan.md` | |
| 6 | Module API Testing (UI split-pane kiểu Postman) | Completed | `UI_API_TESTING_PLAN` | |
| 7 | UI Design System — theme Teal Enterprise | Completed | `UI.md` | |
| 8 | SRS — Screen Inventory & Specification | Completed | `SRS.md` | Chưa review với giảng viên |
| 9 | Phân tích và fix lỗi song song hoá TestRun (Kafka partition key) | Completed | `analysis_parallel_testrun_V6.md` | |
| 10 | Kế hoạch scale horizontal (Kubernetes + KEDA) | Partial | `scale-horizontal-kubernetes.md` | Chỉ dừng ở mức tài liệu phân tích, chưa deploy K8s thật |

---

## 4.2. Các chức năng chưa hoàn thành

| STT | Chức năng | Lý do chưa hoàn thành | Hướng cải thiện |
|---:|---|---|---|
| 1 | Unit/Integration test tự động cho backend | Ưu tiên thời gian cho việc hoàn thiện các tính năng lõi (Run TestCase, Local Agent, API Testing) trước deadline | Viết test cho các service quan trọng (TestRunService, ApiTestExecutorService) ở giai đoạn sau |
| 2 | Deploy thực tế lên Kubernetes + KEDA | Nhóm không có sẵn cluster Kubernetes cho môn học này | Nếu có điều kiện, thử nghiệm trên GKE/EKS free tier ở học kỳ sau |
| 3 | Kiểm tra bảo mật/phân quyền toàn diện | Chưa đến giai đoạn hardening trong lịch trình project | Bổ sung test case cho authorization ở các endpoint `/internal/**` và role-based access |

---

## 4.3. Tổng hợp AI hỗ trợ trong project

| Hạng mục | AI có hỗ trợ không? | Mức độ hỗ trợ | Ghi chú |
|---|---|---|---|
| Requirement | Có | Trung bình | Khung mẫu Screen Specification trong SRS |
| Design | Có | Nhiều | State machine, Outbox Pattern, Local Agent, API Testing architecture, UI token system |
| Database | Có | Trung bình | Schema Flyway, chẩn đoán lỗi Hibernate 7 |
| Coding | Có | Nhiều | Skeleton code cho các service/component mới |
| Debug | Có | Nhiều | Kafka partition issue, screenshot mất, YAML duplicate, tham số bị ghi đè |
| Testing | Có | Ít | Chủ yếu test thủ công, chưa có automated test hỗ trợ bởi AI |
| Report | Có | Trung bình | Tổng hợp 4 file minh bạch AI (Phase 06) |
| Presentation | Không | — | Chưa thực hiện tại thời điểm ghi log |

---

## 4.4. Bài học rút ra

```text
- AI hiệu quả nhất khi được cung cấp đầy đủ ngữ cảnh (source code liên quan, stack công nghệ,
  ràng buộc thực tế) — các session mơ hồ dễ dẫn đến giải pháp "đẹp trên lý thuyết" nhưng có lỗ
  hổng thực tế (ví dụ circular dependency trong thiết kế API Testing ban đầu).
- Những bug nguy hiểm nhất từ AI-generated code không nằm ở cú pháp mà ở các chi tiết nghiệp vụ
  dễ bị bỏ sót (thiếu projectId, sai field response, tham số bị ghi đè) — chỉ phát hiện được
  khi chạy thử thực tế, không chỉ đọc code.
- Với hệ thống phân tán (Kafka, đa service, đa instance), AI hữu ích để đưa ra giả thuyết
  nhanh, nhưng việc xác nhận nguyên nhân gốc vẫn cần thực nghiệm (thêm log, tái hiện lỗi) thay
  vì tin tưởng tuyệt đối vào phân tích của AI.
```

---

## 4.5. Hướng cải thiện tiếp theo

```text
- Bổ sung automated test (unit + integration) cho các service async quan trọng.
- Thử nghiệm thực tế phần scale Kubernetes + KEDA thay vì chỉ dừng ở tài liệu phân tích.
- Rà soát bảo mật/phân quyền cho toàn bộ endpoint `/internal/**` và các luồng Local Agent/API
  Testing mới thêm.
```

---

# 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Phạm Duy Hưng | 30/06/2026 |
