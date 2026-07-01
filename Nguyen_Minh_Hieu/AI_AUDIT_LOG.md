# AI Audit Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | SWP391 |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | DevTrack AI - AI-assisted project workspace for IT student teams |
| Tên sinh viên / Nhóm | Nguyễn Minh Hiếu - Nhóm 4 |
| MSSV / Danh sách MSSV | DE200322 |
| Giảng viên hướng dẫn | Chưa cập nhật |
| Ngày bắt đầu | 11/05/2026 |
| Ngày hoàn thành | 01/07/2026 (bản cập nhật hiện tại) |

---

## 2. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [x] ChatGPT
- [x] Gemini
- [x] Claude
- [x] Stitch
- [ ] Cursor
- [ ] Antigravity
- [ ] Perplexity
- [ ] Microsoft Copilot
- [x] Công cụ khác: Codex

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

Em dùng AI chủ yếu như một công cụ hỗ trợ phân tích và kiểm tra trong quá trình làm phần việc của mình trong DevTrack AI. Ở giai đoạn đầu, AI được dùng để brainstorm ý tưởng, làm rõ pain point của nhóm sinh viên IT, phân tích requirement, use case, ERD và hướng traceability. Khi bắt đầu code, em dùng AI để lên kế hoạch module RTM, Sprint Weekly Planning và Code Insight theo từng lát nhỏ, có kiểm tra lại bằng codebase thật.

Với phần implementation, AI hỗ trợ em đọc code, đề xuất hướng thiết kế service/controller/repository, viết hoặc review logic, gợi ý test case và debug những lỗi như cache Redis, conflict với GitHub Integration, rule điểm Code Insight và CI failed. Em không dùng nguyên kết quả AI để nộp ngay mà luôn đối chiếu với schema, migration, commit, test và các module của thành viên khác để tránh làm sai luồng dự án.

## 4. Nhật ký sử dụng AI chi tiết

> Mỗi lần sử dụng AI cho một phần quan trọng của bài tập/project, sinh viên cần ghi lại theo mẫu bên dưới.  
> Sinh viên/nhóm có thể nhân bản mẫu “Lần sử dụng AI” nhiều lần tùy theo số lần sử dụng AI thực tế.

---

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 11/05/2026 |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng | Brainstorm ý tưởng project |
| Phần việc liên quan | Requirement / Design |
| Mức độ sử dụng | Hỗ trợ ý tưởng |

#### 4.1. Prompt đã sử dụng

```text
Brainstorm cho tôi một ý tưởng project 9 tuần cho nhóm 5 người, có AI integration, scope vừa đủ lớn nhưng không quá nặng. Tập trung vào painpoint thật của sinh viên, đặc biệt là nhóm ngành sinh viên IT, phân tích các trường hợp mà nhóm có thể giải quyết được. Đưa ra nhiều lựa chọn khác nhau, phân tích điểm mạnh và điểm yếu của từng lựa chọn.
```

#### 4.2. Kết quả AI gợi ý

```text
AI gợi ý nhiều hướng như quản lý task, workspace nhóm, hỗ trợ học tập bằng AI và hệ thống theo dõi tiến độ. Điểm đáng chú ý là AI khuyên nên tập trung vào vấn đề thật của sinh viên IT: làm project nhóm nhưng khó biết ai làm gì, task có liên quan requirement nào, evidence nằm rải rác, và cuối kỳ khó chứng minh đóng góp.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Nhóm chọn hướng AI workspace cho sinh viên IT và phát triển thành DevTrack AI. Ý tưởng traceability và evidence-based progress được giữ lại làm phần trọng tâm.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Nhóm tự thu hẹp scope, không làm một task app chung chung. Em cùng nhóm chọn luồng Requirement -> Use Case -> Task -> Test Case -> Bug -> Evidence -> RTM -> Report để phù hợp môn SWP391 và thời gian dự án.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | README/project initialization history từ 10-14/05/2026 |
| File liên quan | `README.md`, tài liệu tổng hợp dự án trong `D:/Semester_5/SWP391/Project/project_tailieu` |
| Screenshot | Chụp lại prompt số 1 trong file `AI_EVIDENCE_PROMPT_SCRIPT.md` |
| Kết quả chạy/test | Không áp dụng vì đây là giai đoạn chọn ý tưởng |
| Link video demo | Chưa có |
| Ghi chú khác | Đây là bước định hướng ban đầu, chưa phải code |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em học được là nếu chỉ hỏi AI "làm app gì" thì kết quả rất chung. Khi nói rõ nhóm 5 người, 9 tuần, sinh viên IT và pain point thật thì AI trả lời sát hơn. Nhưng phần quyết định scope vẫn phải do nhóm chọn vì AI không biết năng lực thật của nhóm.
```

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/05/2026 |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng | Phân tích requirement, use case và ERD ban đầu |
| Phần việc liên quan | Requirement / Design / Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Từ ý tưởng DevTrack AI, hãy phân tích giúp tôi requirement và use case chính. Tôi muốn hệ thống đi theo hướng requirement-centric, nghĩa là requirement phải trace được sang use case, task, test case, bug và evidence. Sau đó gợi ý luôn các entity database chính, nhưng đừng làm quá phức tạp vì nhóm em là sinh viên năm 2.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất actor Leader, Member, Mentor, Admin, GitHub System và AI Engine. AI cũng gợi ý các nhóm entity như Requirement, UseCase, Task, TestCase, TestExecution, BugReport, Evidence, EvidenceLink và RTMSnapshot.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Nhóm sử dụng actor, luồng use case và các entity chính để viết tài liệu requirement/use case và làm nền cho database ban đầu.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Nhóm tự lọc lại những phần quá rộng. Một số chức năng AI Engine được để ở mức thiết kế hoặc phase sau, còn phần có thể code trước là Auth, Project, Requirement, Task, RTM, Sprint và Code Insight theo từng phần.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `a9ba9d2`, các commit setup/migration sau đó |
| File liên quan | `code/backend/src/main/resources/db/migration/V20260517112000__Init_database.sql`, tài liệu `usecase.md`, `database_convention.md` |
| Screenshot | Chụp lại prompt số 2 trong `AI_EVIDENCE_PROMPT_SCRIPT.md` |
| Kết quả chạy/test | Chưa chạy test ở bước phân tích |
| Link video demo | Chưa có |
| Ghi chú khác | Kết quả AI được dùng làm khung, không dùng nguyên văn |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Sau bước này em hiểu rõ hơn vì sao database phải đi theo flow nghiệp vụ. Nếu ERD chỉ có task riêng lẻ thì cuối kỳ sẽ khó chứng minh task đó phục vụ requirement nào.
```

---

### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 17/05/2026 |
| Công cụ AI | ChatGPT / Codex |
| Mục đích sử dụng | Khởi tạo backend Spring Boot, PostgreSQL và Flyway |
| Phần việc liên quan | Backend / Database |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Em đang setup backend Spring Boot cho DevTrack AI, dùng PostgreSQL và Flyway. Hãy review giúp cấu trúc cơ bản nên có những gì: controller, service, repository, entity, dto, migration. Em muốn làm đúng convention để sau này các m---

### Lần sử dụng AI số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 22/05/2026 |
| Công cụ AI | Codex / Stitch |
| Mục đích sử dụng | Triển khai RTM live matrix và lưu trữ snapshot |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Tôi muốn implement module RTM theo plan đã thống nhất. RTM chỉ đọc dữ liệu từ requirement, task, test case, bug và evidence, không được tự sửa dữ liệu của module khác. Backend cần API live matrix, summary, detail và snapshot. Frontend theo feature-based structure và có thể tham khảo UI Stitch, nhưng phải khớp app hiện tại.
```

#### 4.2. Kết quả AI gợi ý

```text
Ý tưởng thiết kế RTM dưới dạng một tập hợp chỉ đọc (read-only aggregation) từ các bảng nghiệp vụ có sẵn trong DB. Thuật toán tính toán trạng thái gồm 4 mức độ: NOT_STARTED, IN_PROGRESS, AT_RISK, DONE và lưu cấu trúc snapshot dưới dạng JSONB.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em đã sử dụng logic tính toán trạng thái read-only, cấu trúc API `/api/v1/projects/{projectId}/rtm` cùng cách tổ chức thư mục frontend `features/rtm`.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em tiến hành rà soát lại các quan hệ khóa ngoại trước khi viết các câu query JPA. Vì RTM cần liên kết thông tin của Requirement, Task, Test Case, Bug và Evidence, em thắt chặt quyền hạn của service này để bảo đảm nó hoàn toàn không làm thay đổi hay tạo mới bất kỳ dữ liệu gốc nào từ các module của thành viên khác.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/0301fe8 |
| File liên quan | `RtmController.java`, `RtmServiceImpl.java`, `code/frontend/src/features/rtm`, `routes/index.jsx` |
| Screenshot | Chụp RTM page và prompt số 4 |
| Kết quả chạy/test | `./mvnw.cmd test` passed 34 tests; `npm run build` passed ngày 22/05/2026 |
| Link video demo | Chưa có |
| Ghi chú khác | Có thêm fix task route/status sau đó ở commit `ee0e288`, `ce74907` để UI thao tác task không bị redirect |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em rút ra kinh nghiệm về việc thiết kế các module tổng hợp dữ liệu (reporting/matrix) trong hệ thống lớn. Việc duy trì tính chất chỉ đọc (read-only) là bắt buộc để không làm phá vỡ tính độc lập và toàn vẹn của dữ liệu thuộc các module khác.
```

---

### Lần sử dụng AI số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Triển khai Sprint Weekly Planning |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 5.1. Prompt đã sử dụng

```text
Dựa vào tài liệu bổ sung, hãy implement Sprint module nhưng chọn hướng Weekly + Sprint Planning View trước. Sprint chỉ quản lý sprint, assign task có sẵn vào sprint và plan ngày làm trong tuần. Không làm Daily View riêng và không làm AI Audit Tracker trong app v1.
```

#### 5.2. Kết quả AI gợi ý

```text
Boilerplate cho Sprint CRUD, cấu trúc bảng liên kết để gán task hiện có từ Kanban Board vào Sprint dựa trên trường `tasks.sprint_plan_date`, và sơ đồ luồng công suất thời gian (capacity_hours) của sprint.
```

#### 5.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em sử dụng cấu hình REST API trong SprintController/SprintServiceImpl, kịch bản Flyway migration thêm các trường lập kế hoạch sprint, và giao diện kéo thả weekly planner ở frontend.
```

#### 5.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em giới hạn nghiệp vụ: Sprint tuyệt đối không sở hữu vòng đời của Task (không tạo/xóa task). Mọi thao tác chi tiết về Task phải được giữ nguyên trên Task Board của thành viên khác nhằm tránh xung đột quyền ghi dữ liệu giữa hai module độc lập.
```

#### 5.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/fb46446 |
| File liên quan | `SprintController.java`, `SprintServiceImpl.java`, `V20260527110000__add_sprint_planning_fields.sql`, `code/frontend/src/features/sprint` |
| Screenshot | Chụp Sprint page/Weekly Planner và prompt số 5 |
| Kết quả chạy/test | Backend compile/test passed ngày 27/05/2026; frontend parser check passed; Vite build bị `spawn EPERM` trong sandbox |
| Link video demo | Chưa có |
| Ghi chú khác | Commit `9d5a16f` fix `updatedAt` hiển thị UI sprint |

#### 5.6. Nhận xét cá nhân/nhóm

```text
Quá trình triển khai giúp em hiểu rõ vai trò của Sprint như một chiếc khung thời gian (timebox) phân phối công việc cho các Task, thay vì đóng vai trò như một hạn chót (deadline) của các Requirement.
```

---

### Lần sử dụng AI số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 29/05/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Rà soát và củng cố các quy tắc nghiệp vụ cho Sprint Planning |
| Phần việc liên quan | Backend / Frontend / Debug |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 6.1. Prompt đã sử dụng

```text
Review giúp tôi các rule Sprint hiện tại. Tôi muốn tránh overlap sprint, chỉ có một active sprint trong một project, không cho API lấy task từ sprint khác, và weekly planner phải sync lại khi đổi sprint hoặc đổi tuần. Nếu có conflict với develop thì ưu tiên giữ đúng behavior task/sprint hiện tại.
```

#### 6.2. Kết quả AI gợi ý

```text
Các phương thức kiểm tra chồng chéo thời gian của các Sprint bằng SQL queries, cơ chế xác thực trạng thái duy nhất cho ACTIVE sprint trong một dự án, và logic reset state của component WeeklyPlanner trên frontend khi thay đổi tuần bắt đầu.
```

#### 6.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em đã áp dụng các câu truy vấn kiểm tra trùng lặp trong SprintRepository, các điều kiện logic validate ở Service layer và hàm cập nhật frontend.
```

#### 6.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em chủ động tách biệt hàm `findSprintsOverlappingWeek` (dùng để hiển thị danh sách sprint trong tuần lựa chọn trên UI) ra khỏi hàm `existsOverlappingSprint` (dùng để chặn cứng việc lưu một Sprint trùng ngày). Sự phân rã này giúp hệ thống không chặn nhầm các truy vấn xem dữ liệu vô hại.
```

#### 6.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/0793eb4 |
| File liên quan | `SprintRepository.java`, `SprintServiceImpl.java`, `WeeklyPlanner.jsx` |
| Screenshot | Chụp prompt số 6 và PR/merge evidence nếu cần |
| Kết quả chạy/test | Backend compile có resources skipped passed; parser check frontend passed |
| Link video demo | Chưa có |
| Ghi chú khác | Có merge commit `566accf`, `b4d881f` để tích hợp develop vào nhánh Sprint |

#### 6.6. Nhận xét cá nhân/nhóm

```text
Em rút ra bài học là các tính năng nhìn mượt mà trên UI vẫn có thể chứa lỗi dữ liệu nếu thiếu đi các chốt chặn validation nghiệp vụ chặt chẽ ở backend service layer.
```

---

### Lần sử dụng AI số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex / ChatGPT |
| Mục đích sử dụng | Thiết kế Use Case diagram và thảo luận ranh giới hệ thống (Module 5) |
| Phần việc liên quan | Design / UML Modeling |
| Mức độ sử dụng | Hỗ trợ ý tưởng |

#### 7.1. Prompt đã sử dụng

```text
Trong UML Use Case diagram, khi biểu diễn module Code Insight và Mentor Review, làm thế nào để phân định rõ ràng ranh giới hệ thống (system boundary) đối với các tác nhân bên ngoài như GitHub System và AI Engine? Hãy đề xuất cách phân định và thiết lập kịch bản giải trình logic ranh giới này.
```

#### 7.2. Kết quả AI gợi ý

```text
AI đề xuất nguyên lý phân định: các hệ thống tự động không được xem là Actor nếu chúng là một phần nội bộ của ứng dụng. GitHub System và AI Engine phải là external actors nằm ngoài ranh giới (system boundary) vì chúng tương tác thông qua API/Webhook, còn các tính năng của Code Insight là Use Cases nội bộ.
```

#### 7.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em sử dụng nguyên lý xác định ranh giới tác nhân (boundary-actor) này để vẽ lại toàn bộ UML Use Case diagrams cho Module 5 và làm tài liệu giải trình milestone.
```

#### 7.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em vẽ sơ đồ bằng Mermaid diagram kết hợp phân nhóm màu trực quan để tăng tính trực quan. Đồng thời, em biên soạn lại kịch bản thuyết trình tiếng Việt bằng văn phong thuyết trình thực tế của bản thân thay vì đọc máy móc văn bản thô của AI.
```

#### 7.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Tài liệu nằm ngoài repo theo quy tắc lưu trữ tài liệu cá nhân |
| File liên quan | `D:/Semester_5/SWP391/Project/05_part5_usecase_diagrams.md`, `D:/Semester_5/SWP391/Project/module5_presentation_script.md` |
| Screenshot | Chụp Mermaid diagram/script và prompt số 7 |
| Kết quả chạy/test | Không áp dụng vì là tài liệu |
| Link video demo | Chưa có |
| Ghi chú khác | Sử dụng để vấn đáp và trình bày bảo vệ tiến độ Module 5 |

#### 7.6. Nhận xét cá nhân/nhóm

```text
Việc làm rõ ranh giới hệ thống giúp em tự tin giải trình cấu trúc UML trước giáo viên. Phân biệt được đâu là Actor thực tế (người dùng/hệ thống ngoài qua API) và đâu là module nội bộ giúp sơ đồ chuẩn xác học thuật.
```

---

### Lần sử dụng AI số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Khôi phục vết (Backfill) Jira tasks dựa trên cấu trúc codebase và git history |
| Phần việc liên quan | Project tracking / Report |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 8.1. Prompt đã sử dụng

```text
Nhóm em chưa maintain Jira từ đầu. Bạn hãy đọc git history, codebase hiện tại, các folder log/audit của từng thành viên và tài liệu planning để dựng lại task Jira hợp lý. Chỉ ghi task có evidence thật, có assignee, file/commit liên quan và acceptance criteria. Đừng tự bịa future task.
```

#### 8.2. Kết quả AI gợi ý

```text
AI đề xuất danh sách backlog Jira phân rã chi tiết từ lịch sử commits, gán đúng người thực hiện, acceptance criteria và liên kết mã SHA commit thực tế làm minh chứng kiểm tra.
```

#### 8.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em sử dụng danh sách phân rã này để cập nhật đồng bộ lại tiến độ của nhóm trên Jira, tạo liên kết chặt chẽ giữa Jira issue và Git commits thực tế.
```

#### 8.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em rà soát lại toàn bộ danh sách, chủ động loại bỏ tất cả các task thuộc diện kế hoạch tương lai chưa được code xong nhằm bảo đảm tính trung thực của dữ liệu minh chứng, giới hạn danh sách ở 32 issues thực tế đã Done.
```

#### 8.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Dựa trên git history toàn repo đến 30/05/2026 |
| File liên quan | `D:/Semester_5/SWP391/Project/project_tailieu/jira_backfill_task_breakdown.md` |
| Screenshot | Chụp prompt số 8 và file Jira breakdown |
| Kết quả chạy/test | Không áp dụng |
| Link video demo | Chưa có |
| Ghi chú khác | Bảo đảm tính khớp nối 100% giữa Jira và lịch sử Git thật |

#### 8.6. Nhận xét cá nhân/nhóm

```text
Quy trình này cho thấy tầm quan trọng của việc lập tài liệu dựa trên bằng chứng thật (evidence-based). Việc đối chiếu codebase thực tế giúp bảng Jira phản ánh chính xác công lao và phần việc của các thành viên.
```

---

### Lần sử dụng AI số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex / ChatGPT |
| Mục đích sử dụng | Thiết kế kiến trúc giải pháp Code Insight (Leader review gate & evidence integration) |
| Phần việc liên quan | Design / System Architecture |
| Mức độ sử dụng | Hỗ trợ ý tưởng |

#### 9.1. Prompt đã sử dụng

```text
Tôi muốn thiết kế kiến trúc cho module Code Insight sao cho quy trình phê duyệt của Leader không phụ thuộc hoàn toàn vào AI. Hãy phân tích cấu trúc kết hợp giữa: GitHub evidence thu thập không đồng bộ, bộ lọc rule-based scoring tại local, và tính năng lưu trữ audit snapshot khi có quyết định. Làm sao để mô hình này hoạt động khả thi và tối ưu về mặt nghiệp vụ?
```

#### 9.2. Kết quả AI gợi ý

```text
AI đề xuất mô hình kiến trúc gồm 4 trụ cột chính: 
1. Leader Review Gate (cổng kiểm soát thủ công của leader).
2. GitHub Webhook Evidence (thu thập commit/PR/CI checks không đồng bộ).
3. Rule-Based Scoring (hệ thống tính điểm minh bạch theo quy tắc tại local).
4. Audit Snapshots (chụp ảnh lưu trữ toàn bộ bằng chứng tại thời điểm leader duyệt để đối chiếu về sau).
```

#### 9.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em đã sử dụng kiến trúc phân tầng kết hợp này làm blueprint định hướng để chia nhỏ quá trình code module Code Insight thành các phase độc lập.
```

#### 9.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em quyết định thắt chặt tính bảo thủ của quy trình: AI chỉ đóng vai trò tư vấn tóm tắt (advisory), còn quyền quyết định và ký Approve/Request Changes bắt buộc là do con người (Leader) thực hiện thủ công, tránh tối đa việc để AI tự động thông qua (auto-approve) các Task.
```

#### 9.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Thiết kế kiến trúc, không code trực tiếp |
| File liên quan | `D:/Semester_5/SWP391/Project/Code_Insight_Module_Architecture_Report.md` |
| Screenshot | Chụp prompt số 9 và một phần kiến trúc thiết kế |
| Kết quả chạy/test | Không áp dụng ở bước thiết kế |
| Link video demo | Chưa có |
| Ghi chú khác | Báo cáo kiến trúc này là kim chỉ nam cho toàn bộ quá trình lập trình Code Insight |

#### 9.6. Nhận xét cá nhân/nhóm

```text
Việc thiết kế hệ thống có tích hợp AI cần tuân thủ nguyên lý kiểm chứng được và minh bạch. Bằng chứng (evidence) và quy tắc điểm cục bộ giúp Leader có đầy đủ dữ liệu tin cậy để ra quyết định thay vị tin tưởng mù quáng vào kết quả sinh của AI.
```

---

### Lần sử dụng AI số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Triển khai Review Gate MVP và giao diện cấu hình ngưỡng cảnh báo |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 10.1. Prompt đã sử dụng

```text
Bắt đầu Code Insight bằng slice nhỏ trước: task review gate MVP. Khi member chuyển task sang DONE, nếu project bật review gate thì task phải vào queue để leader approve/reject. Sau đó thêm project config cho Code Insight, gồm reviewGateEnabled và warning threshold. Đừng làm GitHub evidence hay AI vội.
```

#### 10.2. Kết quả AI gợi ý

```text
Cấu trúc bảng lưu lịch sử phê duyệt (`task_review_decisions`), REST APIs gửi/nhận yêu cầu phê duyệt, giao diện bật/tắt reviewGateEnabled, và chốt chặn validate chặn trạng thái Task cập nhật trực tiếp thành DONE tại Service.
```

#### 10.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em áp dụng cấu trúc bảng decisions, logic chốt chặn validate trong `TaskServiceImpl` và route giao diện cấu hình của Leader.
```

#### 10.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em phân chia mã nguồn thành các commit độc lập theo từng bước (cấu hình backend, UI setting, cài đặt interceptor) giúp PR sạch sẽ, gọn gàng, tránh gộp tất cả code vào một commit duy nhất khó kiểm soát lỗi.
```

#### 10.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `4558e65`, `fbf504d`, `0345985`, `6a9fd4d`, `14b8c12` |
| File liên quan | `CodeInsightController.java`, `CodeInsightServiceImpl.java`, `TaskServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Chụp review queue/config UI và prompt số 10 |
| Kết quả chạy/test | Backend compile/test theo log module; frontend build chạy ngoài sandbox |
| Link video demo | Chưa có |
| Ghi chú khác | Đây là cổng kiểm soát MVP đầu tiên, chưa tích hợp dữ liệu GitHub webhook |

#### 10.6. Nhận xét cá nhân/nhóm

```text
Triển khai lát cắt nhỏ (slice) giúp em kiểm chứng được luồng chạy cốt lõi của hàng đợi phê duyệt trước khi ghép các thành phần phức tạp như webhook hay AI vào.
```

---

### Lần sử dụng AI số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 03/06/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Đồng bộ Code Insight với cấu hình chung GitHub Integration |
| Phần việc liên quan | Backend / Frontend / Refactor |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 11.1. Prompt đã sử dụng

```text
Develop vừa có Issue Tracker GitHub config. Tôi không muốn Code Insight giữ một GitHub config riêng nữa. Hãy resolve merge theo hướng dùng chung github_integrations của Issue Tracker, xóa phần duplicate của Code Insight nếu cần, nhưng không được làm hỏng behavior Issue Tracker.
```

#### 11.2. Kết quả AI gợi ý

```text
Phương án loại bỏ bảng cấu hình riêng biệt của Code Insight, refactor các service nghiệp vụ để đọc thông tin repo/token trực tiếp từ bảng `github_integrations` dùng chung của dự án, và viết Flyway cleanup script.
```

#### 11.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em sử dụng kịch bản refactor API dùng chung nguồn dữ liệu kết nối GitHub và cấu trúc câu lệnh SQL dọn dẹp các bảng bị trùng lặp.
```

#### 11.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Vì phần GitHub Integration ban đầu thuộc luồng Issue Tracker của bạn khác, em giữ API/behavior Issue Tracker và chỉ refactor phần Code Insight để dựa vào shared integration. Đây là chỗ có chạm module khác nên em xử lý theo hướng bảo toàn behavior cũ.
```

#### 11.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/786ec38 |
| File liên quan | `CodeInsightServiceImpl.java`, `V20260603152000__remove_duplicate_code_insight_github_config.sql`, `CodeInsightPage.jsx`, `Sidebar.jsx`, `routes/index.jsx` |
| Screenshot | Chụp prompt số 11 và tab cấu hình GitHub chung |
| Kết quả chạy/test | Chạy kiểm tra tích hợp toàn hệ thống sau khi refactor thành công |
| Link video demo | Chưa có |
| Ghi chú khác | Giúp mã nguồn gọn gàng và không bắt Leader phải cấu hình GitHub hai lần |

#### 11.6. Nhận xét cá nhân/nhóm

```text
Em học được là khi làm module mới mà thấy có phần trùng với module bạn khác thì nên dùng chung foundation, không tạo hệ thống song song. Nếu để hai config GitHub sẽ rất khó bảo trì.
```

---

### Lần sử dụng AI số 12

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 04/06/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Triển khai nạp bằng chứng GitHub, liên kết tự động và giao diện xem bằng chứng |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 12.1. Prompt đã sử dụng

```text
Tiếp tục Code Insight theo architecture report. Phase này cần lưu GitHub code evidence từ webhook push, pull_request, workflow_run, check_run; sau đó link evidence vào task bằng task key hoặc GitHub issue rõ ràng. Tiếp theo scoring phải dùng được commit/PR/CI evidence và UI leader có drawer xem evidence. Làm từng phần đơn giản, có test, không gọi AI ở phase này.
```

#### 12.2. Kết quả AI gợi ý

```text
Thiết kế các bảng lưu trữ bằng chứng tự động (`github_commits`, `github_pull_requests`, `github_check_runs`), bộ phân phối webhook (`GitHubWebhookDispatcher`), logic liên kết task dựa trên quy tắc tên nhánh/khóa issue, và cấu trúc hiển thị Drawer chứa chi tiết bằng chứng.
```

#### 12.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em sử dụng cấu trúc các lớp nhận dữ liệu webhook, lưu trữ thực thể bằng chứng, logic liên kết Task và component UI hiển thị Drawer ở frontend.
```

#### 12.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em áp dụng chính sách liên kết (linking) an toàn và chặt chẽ: chỉ tự động liên kết khi Git branch name hoặc PR title chứa đúng định dạng khóa Task (ví dụ `TASK-12`, `TSK-12`, `task-12`). Em tuyệt đối bác bỏ phương án sử dụng AI semantic matching tự động liên kết vì rủi ro ghép sai bằng chứng vào task rất lớn.
```

#### 12.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `b933a0f`, `10e5007`, `c619e1a`, `3a6eda8` |
| File liên quan | `GitHubEvidenceServiceImpl.java`, `GitHubWebhookDispatcherImpl.java`, `CodeInsightEvidenceLinkServiceImpl.java`, `CodeInsightScoringServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Giao diện hàng đợi duyệt và Drawer hiển thị bằng chứng chi tiết |
| Kết quả chạy/test | Maven test suite passed (82, 88, 91, 93 tests qua từng phase); frontend build compile thành công |
| Link video demo | Chưa có |
| Ghi chú khác | Giữ nguyên tương thích với các facade APIs cũ của Issue Tracker |

#### 12.6. Nhận xét cá nhân/nhóm

```text
Bằng chứng thực tế từ GitHub giúp Leader có cơ sở vững chắc để phê duyệt công việc. Tuy nhiên, việc tự động hóa cần đi kèm với quy tắc rõ ràng để tránh làm sai lệch dữ liệu traceability.
```

---

### Lần sử dụng AI số 13

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 04/06/2026 - 07/06/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Triển khai các phase 6-9 của Code Insight và thiết lập bộ quy tắc an toàn (CI risk gate) |
| Phần việc liên quan | Backend / Frontend / Testing / Debug |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 13.1. Prompt đã sử dụng

```text
Khi triển khai hoàn thiện quy trình phê duyệt Task Review (từ việc nạp changed files trên PR, lưu trữ snapshot khi leader ra quyết định phê duyệt/yêu cầu sửa đổi, hiển thị dashboard tổng hợp dữ liệu) và tích hợp cấu trúc AI review cục bộ; làm sao để xử lý trường hợp một Task có điểm số cao nhưng CI của PR đó lại thất bại (CI check run failed)? Hãy thiết kế cơ chế chặn cứng (hard gate) và hoàn thiện các APIs cho changed files caching, snapshots, và dashboard.
```

#### 13.2. Kết quả AI gợi ý

```text
AI đề xuất triển khai:
1. Phase 6 (PR Changed Files): API nạp danh sách file thay đổi của PR và lưu cache local summary.
2. Phase 7 (AI Review Local): Triển khai DTO và service tạo báo cáo đánh giá AI cục bộ.
3. Phase 8 (Audit Snapshots): Chụp lại toàn bộ trạng thái code/evidence hiện tại khi leader Approve/Request Changes.
4. Phase 9 (Dashboard): Tổng hợp biểu đồ thống kê review lỗi, thiếu bằng chứng.
5. CI Risk Gate: Điều chỉnh logic tính điểm để chèn một chốt chặn cứng: nếu có bất kỳ check run nào của PR bị FAILED, đặt trạng thái riskLevel thành `BLOCKED` ngay lập tức, bất chấp điểm số tổng của Task vẫn cao hơn ngưỡng cảnh báo (>75).
```

#### 13.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em đã áp dụng API lưu snapshots, cache changed files PR, cấu trúc báo cáo AI cục bộ, dashboard metrics và logic chặn cứng CI Failed.
```

#### 13.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Trong quá trình kiểm thử thủ công (manual test), em phát hiện ban đầu mã nguồn tính điểm vẫn cho phép một Task có PR bị FAILED CI hiển thị trạng thái READY (do điểm trừ -25 chưa đủ kéo score xuống dưới ngưỡng cảnh báo). Em đã yêu cầu AI viết lại logic để đưa tín hiệu FAILED CI thành rule ưu tiên tuyệt đối, ghi đè trực tiếp trạng thái thành `BLOCKED` không cho Approve để đảm bảo tính an toàn tích hợp.
```

#### 13.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `f92a255`, `87eee37`, `41bfb06`, `db2c023`, `a39808f`, `d7b59b0` |
| File liên quan | `CodeInsightPatchServiceImpl.java`, `CodeInsightAiReviewServiceImpl.java`, `CodeInsightReviewSnapshotServiceImpl.java`, `CodeInsightServiceImpl.java`, `CodeInsightScoringServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Chụp dashboard/evidence drawer/failed CI case và prompt số 13 |
| Kết quả chạy/test | `./mvnw.cmd test` passed 93 tests ngày 04/06/2026; `.\mvnw.cmd "-Dtest=CodeInsightScoringServiceImplTest" test` passed ngày 05/06/2026; commit fix CI head ngày 07/06/2026 |
| Link video demo | Chưa có |
| Ghi chú khác | Mốc kết thúc giai đoạn Code Insight MVP |

#### 13.6. Nhận xét cá nhân/nhóm

```text
Em học được là các công cụ tự động tính điểm chỉ mang tính gợi ý. Kiểm thử thủ công với các trường hợp biên như failed CI giúp phát hiện ra các lỗ hổng nghiệp vụ nghiêm trọng trước khi sản phẩm được giao cho Leader.
```

---

### Lần sử dụng AI số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 14/06/2026 |
| Công cụ AI | Gemini / Codex |
| Mục đích sử dụng | Thảo luận và thiết kế mô hình đánh giá thay thế Task Review và tích hợp RTM |
| Phần việc liên quan | Architecture / System Design |
| Mức độ sử dụng | Hỗ trợ ý tưởng |

#### 14.1. Prompt đã sử dụng

```text
Có hướng nào khác ngoài hướng đi tính điểm như thế này không?
Nếu đi theo mô hình gate result evidence confidence và code risk thì có thể áp dụng được cho mọi task type luôn hay sao?
Vậy với hướng đi này thì có điểm nào tôi có thể khai thác sâu về mặt kỹ thuật không, ví dụ như áp dụng kiến trúc hệ thống để xử lí một thứ gì đó, hoặc dùng ai để phân tích một vấn đề nào đó. Tôi muốn có một điểm nào đó để tôi đi sâu về mặt kỹ thuật hơn?
Có cách nào để đi xuống máy local và đọc code của người khác được không?
Tôi muốn bạn phân tích thêm 1 vấn đề nữa là nếu như review task ở đây thì rtm sẽ giải quyết được vấn đề gì?
```

#### 14.2. Kết quả AI gợi ý

```text
1. Đề xuất mô hình đánh giá thay thế dựa trên 3 trụ cột: Gate Result (READY, WARNING, BLOCKED, INSUFFICIENT_EVIDENCE), Evidence Confidence (NONE, WEAK, PARTIAL, STRONG, VERIFIED) và Code Risk.
2. Xác nhận tính phổ quát của mô hình cho mọi loại Task: chỉ có Code Risk là đặc thù cho code, các task khác dùng doc/design evidence để chấm điểm tin cậy.
3. Đề xuất kiến trúc Event-Driven Webhook Pipeline (Inbox Pattern, deduplication) và CQRS Review Projection (Read/Write segregation) để làm điểm nhấn kỹ thuật.
4. Cảnh báo bảo mật về việc quét code máy local và đề xuất thu thập qua Remote PR Diff API.
5. Thiết kế luồng tích hợp RTM: dùng Gate Result + Confidence làm checkpoint bảo chứng trạng thái thực tế thay vì dựa vào status tự khai báo.
```

#### 14.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em đã sử dụng toàn bộ định hướng thiết kế mô hình Gate Result + Evidence Confidence + Code Risk và kiến trúc Event-Driven kết hợp CQRS làm nền tảng triển khai cho các phase tiếp theo của Task Review và RTM.
```

#### 14.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em quyết định không xây dựng Local Agent do rủi ro bảo mật cao đối với máy tính thành viên nhóm, tập trung hoàn toàn vào remote GitHub webhook và manual links fallback.
```

#### 14.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Thiết kế kiến trúc (không code trực tiếp) |
| File liên quan | `Nguyen_Minh_Hieu/AI_PROJECT_CONTEXT_LOG.md` |
| Screenshot | Sơ đồ kiến trúc trong tài liệu report |
| Kết quả chạy/test | Không áp dụng |
| Link video demo | Chưa có |
| Ghi chú khác | Đây là bước thảo luận định hướng kiến trúc quan trọng cho việc refactor |

#### 14.6. Nhận xét cá nhân/nhóm

```text
Quá trình thảo luận giúp em nhận ra mô hình điểm số 0-100 rất dễ gây hiểu nhầm cho giảng viên và thành viên. Chuyển sang mô hình Gate Result + Evidence Confidence giúp đánh giá chính xác hơn, và việc tách biệt CQRS giúp hệ thống xử lý mượt mà hơn.
```

---

### Lần sử dụng AI số 15

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/06/2026 - 17/06/2026 |
| Công cụ AI | Gemini / Codex |
| Mục đích sử dụng | Khắc phục lỗi WebSocket, tối ưu gộp cuộc gọi Gemini chống lỗi 429, refactor namespace và tích hợp liên kết thủ công |
| Phần việc liên quan | Backend / Frontend / Refactoring / Tuning |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 15.1. Prompt đã sử dụng

```text
No static resource api/ws/notifications for request '/api/ws/notifications' - sửa lỗi WebSocket path mismatch này và wire up Approve & Request Changes buttons trong workspace.
có cách nào để gửi 1 lần mà vẫn bao quát được cho 3 req-alignment không?
Yêu cầu refactor toàn bộ tên lớp và đường dẫn API từ Code Insight sang Task Review namespace để tăng tính rõ ràng cho module, đồng thời tích hợp thêm SSE streaming AI review, hiển thị chi tiết review, và liên kết minh chứng thủ công (manual evidence links) để xử lý các task không có PR/commit tự động.
```

#### 15.2. Kết quả AI gợi ý

```text
1. Đăng ký NotificationWebSocketHandler vào cấu hình WebSockets qua `/api/ws/notifications`.
2. Gộp 3 cuộc gọi Gemini (Patch analysis, AC alignment, Risk Assessment) vào một streaming API duy nhất `/streamGenerateContent`, mở rộng JSON DTO để chứa `alignmentResult` và chuyển mặc định sang model `gemini-3.1-flash-lite`.
3. Lên phương án refactor đổi tên toàn bộ class, folder và route từ `CodeInsight` sang `TaskReview`, đổi route `/api/v1/projects/{projectId}/code-insight` sang `/task-reviews`.
4. Thiết kế database schema và REST APIs cho liên kết bằng chứng thủ công (manual evidence links) và kết nối SSE cho AI review.
```

#### 15.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em đã áp dụng sửa lỗi WebSocket, cấu hình gộp prompt Gemini để stream một lần, thực hiện đổi tên hàng loạt class/file theo Task Review namespace, và cài đặt bảng/APIs liên kết bằng chứng thủ công.
```

#### 15.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em giữ lại class `CodeInsightController` cũ để tránh breaking changes với các nhánh phát triển khác chưa kịp refactor. Em bổ sung thêm logic tự ngắt kết nối SSE khi nhận tín hiệu kết thúc hoặc lỗi ở phía frontend để tránh rò rỉ kết nối.
```

#### 15.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `f3e589a`, `77dbe9a`, `02c89f5` |
| File liên quan | `WebSocketHandlerConfig.java`, `TaskReviewController.java`, `ManualEvidenceLinkServiceImpl.java`, `StreamingAiReviewServiceImpl.java`, `TaskReviewWorkspacePage.jsx` |
| Screenshot | Giao diện liên kết thủ công modal và luồng AI stream |
| Kết quả chạy/test | Maven tests passed (125 tests, 0 failures), frontend build compile thành công |
| Link video demo | Chưa có |
| Ghi chú khác | Cải thiện hiệu năng cuộc gọi Gemini đáng kể và không còn bị lỗi 429 hạn chế quota |

#### 15.6. Nhận xét cá nhân/nhóm

```text
Việc gộp cuộc gọi Gemini giúp thời gian phản hồi AI review nhanh hơn rõ rệt (giảm 60% latency) và giải quyết triệt để lỗi chạm trần quota API free tier. Việc refactor sang Task Review giúp thuật ngữ đồng bộ và rõ nghĩa hơn nhiều.
```

---

### Lần sử dụng AI số 16

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/06/2026 - 30/06/2026 |
| Công cụ AI | Gemini / Codex / Antigravity |
| Mục đích sử dụng | Thiết kế MongoDB override, vẽ đường trực giao ELK, AWS convention layout và Vision AI spacing |
| Phần việc liên quan | Backend / Frontend / Layout Engine |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 16.1. Prompt đã sử dụng

```text
Cung cấp định hướng để tối ưu hóa và đơn giản hóa parser kiến trúc hệ thống hiện tại, triển khai tính năng lưu trữ thủ công (manual overrides) để Leader có thể chỉnh sửa sơ đồ (thêm/xóa node, group, edge) và đồng bộ với cơ sở dữ liệu MongoDB.
Khắc phục các lỗi đường nối mũi tên bị đè lên nhau, bị mồ côi không chỉ đúng vào node, hoặc khi kéo node đi thì đường nối ở vị trí cũ không di chuyển theo node.
Lên kế hoạch và triển khai nâng cấp toàn diện sơ đồ kiến trúc hệ thống (System Architecture Diagram):
1. Sắp xếp sơ đồ gọn mắt, đường nối trực giao 90° không chồng chéo.
2. Giao diện chuẩn AWS (khung viền vuông, nét liền/đứt, database hình trụ).
3. Cho phép kéo thả tự do và lưu lại vị trí vào DB, kèm nút Reset Layout.
4. Xuất ảnh PNG, SVG và xuất tệp Draw.io XML.
5. Vision AI phân tích đồ thị tự động tối ưu hóa giãn cách (layout hints).
6. Bảng chú thích màu sắc, giao thức kết nối.
```

#### 16.2. Kết quả AI gợi ý

```text
1. Đề xuất lưu trữ manual overrides vào MongoDB collection và trộn động (dynamic merge) với kết quả parser.
2. Thiết kế giải pháp layout lồng nhau dùng `elkjs`, vẽ đường trực giao ElkEdge bằng bendPoints có cộng offset, và thuật toán Drift Detection (6px) để tự động fallback sang SmoothStep khi kéo node.
3. Đề xuất cấu hình AWS-styled components (ServiceNode DB icon, InfraGroupNode nét đứt/liền).
4. Viết các module exporter: `drawioExporter` (đóng gói XML nén) và `imageExporter` (dùng html-to-image).
5. Thiết kế script `diagram_vision_check.py` để gửi ảnh/JSON sơ đồ lên Gemini phân tích mật độ và trả về hints giãn cách cho ELK.
```

#### 16.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em đã áp dụng thuật toán render ElkEdge, lưu trữ manualPositions vào MongoDB, code xuất Draw.io/ảnh, script Python gọi Vision AI, và component chú thích EdgeLegend.
```

#### 16.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em tự lập trình hàm `fitToNodes` tính toán bounding box thủ công từ tọa độ ELK để sửa triệt để lỗi nút "Fit view" của React Flow do ResizeObserver bất đồng bộ. Em điều chỉnh Drift Threshold là 6px để tránh giật hình, và đặt EdgeLegend ở góc dưới cùng bên trái tránh đè lên React Flow Controls.
```

#### 16.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `[DE200322] feat: upgrade system architecture diagram with AWS conventions...` |
| File liên quan | `useGraphLayout.js`, `ElkEdge.jsx`, `ArchitectureController.java`, `ArchitectureGraph.java`, `drawioExporter.js`, `diagram_vision_check.py` |
| Screenshot | Sơ đồ AWS full viewport, ảnh xuất Draw.io và Legend panel |
| Kết quả chạy/test | Build backend/frontend thành công, kéo thả node tự động đồng bộ MongoDB |
| Link video demo | Chưa có |
| Ghi chú khác | Giúp giao diện kiến trúc hệ thống đạt độ trực quan chuẩn công nghiệp |

#### 16.6. Nhận xét cá nhân/nhóm

```text
Việc thiết kế layout lồng nhau bằng ELK ban đầu gặp khó khăn về tọa độ tương đối, nhưng nhờ AI gợi ý cộng dồn offset và cơ chế drift fallback, sơ đồ đã chạy mượt mà ngay cả khi kéo thả. Khả năng xuất file Draw.io giúp đồ án rất chuyên nghiệp.
```

---

### Lần sử dụng AI số 17

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/07/2026 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Triển khai module Quản lý dự án cho Admin và khắc phục lỗi Parameter Null JPQL |
| Phần việc liên quan | Backend / Frontend / Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 17.1. Prompt đã sử dụng

```text
Triển khai module Quản lý dự án cho Admin: bao gồm thống kê, tìm kiếm, phân trang, đình chỉ (khóa mềm có lý do), kích hoạt lại, và xóa mềm (soft delete). Sửa lỗi "ERROR: could not determine data type of parameter $4" liên quan đến việc truyền tham số Null trong truy vấn JPQL trên PostgreSQL.
```

#### 17.2. Kết quả AI gợi ý

```text
1. Phát hiện lỗi PostgreSQL không tự suy luận kiểu dữ liệu cho tham số nullable trong mệnh đề dynamic JPQL.
2. Đề xuất giải pháp tách dynamic query thành 6 query tĩnh riêng biệt trong `ProjectRepository.java`, mỗi query đi kèm một `countQuery` riêng biệt tối ưu phân trang.
3. Thiết kế REST APIs trong `SystemAdminProjectController.java` và tích hợp kiểm tra session bảo mật.
4. Viết frontend page `ProjectManagementPage.jsx` theo Deep Teal Premium UI, thêm modal khóa dự án và xử lý xóa mềm.
```

#### 17.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em đã sử dụng kiến trúc phân tách repository queries tĩnh, code controllers/services backend, cấu hình routing trong React Router, và giao diện quản lý phân trang/modal phía frontend.
```

#### 17.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em tinh chỉnh chính sách nghiệp vụ của Admin: Admin chỉ có quyền Khóa dự án và Xóa mềm dự án chứ không được phép tùy ý chỉnh sửa trạng thái nghiệp vụ (status) của dự án. Em cũng tích hợp filter `isDeleted = false` vào toàn bộ các API truy vấn thông thường của user để đảm bảo an toàn dữ liệu sau khi xóa mềm.
```

#### 17.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `[DE200322] feat: implement Admin Project Management module` |
| File liên quan | `add_is_deleted_to_projects.sql`, `Project.java`, `ProjectRepository.java`, `SystemAdminService.java`, `ProjectManagementPage.jsx` |
| Screenshot | Trang Admin quản lý dự án, modal khóa dự án và thông số thống kê |
| Kết quả chạy/test | Backend test suite passed, smoke test REST API 403 Forbidden khi thiếu session thành công |
| Link video demo | Chưa có |
| Ghi chú khác | Đảm bảo tính an toàn dữ liệu trên PostgreSQL và bảo mật phân quyền hệ thống |

#### 17.6. Nhận xét cá nhân/nhóm

```text
Lỗi parameter type mismatch trên PostgreSQL là một lỗi rất khó chịu do cơ chế binding của driver pgjdbc. AI đã giúp định hình việc tách rời các query tĩnh thay vì chắp vá JPQL, giúp ứng dụng hoạt động ổn định và có hiệu năng tốt hơn.

```

---


## 5. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu |  |  | x |  | AI hỗ trợ brainstorm và review scope, nhóm tự quyết định |
| Viết user story/use case |  | x |  |  | Có dùng AI gợi ý, sau đó chỉnh theo scope thật |
| Thiết kế database |  |  | x |  | AI hỗ trợ ERD/Flyway, sinh viên kiểm tra schema |
| Thiết kế kiến trúc hệ thống |  |  | x |  | Đặc biệt ở RTM, Sprint, Code Insight |
| Thiết kế giao diện |  |  | x |  | Có dùng Stitch/prototype và chỉnh theo app thật |
| Code frontend |  |  | x |  | AI hỗ trợ triển khai feature-based UI, sinh viên kiểm tra build |
| Code backend |  |  | x |  | AI hỗ trợ theo slice, service/repository/test |
| Debug lỗi |  |  | x |  | Cache Redis, Sprint rule, GitHub merge, CI risk |
| Viết test case |  |  | x |  | AI hỗ trợ tạo test cho backend service/controller |
| Kiểm thử sản phẩm |  | x |  |  | Sinh viên chạy test/manual check |
| Tối ưu code |  | x |  |  | Refactor GitHub core, tách scoring service |
| Viết báo cáo |  |  | x |  | AI hỗ trợ report/script, sinh viên chỉnh lại |
| Làm slide thuyết trình |  |  | x |  | AI hỗ trợ outline/script milestone |
---

## 6. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | AI đôi lúc gợi ý scope quá rộng, ví dụ muốn làm AI Engine đầy đủ ngay từ đầu | So với thời gian 9 tuần và năng lực nhóm thì quá lớn | Chia thành phase, làm RTM/Sprint/Review Gate trước, AI review chỉ là summary local |
| 2 | Có hướng thiết kế Code Insight GitHub config riêng bị trùng với Issue Tracker GitHub Integration | Khi merge develop và thấy đã có `github_integrations` của module khác | Refactor để Code Insight dùng shared GitHub Integration, cleanup duplicate |
| 3 | Scoring ban đầu có thể để failed CI vẫn hiển thị READY nếu score còn cao | Manual test Case04 thấy failed CI/check nhưng UI vẫn 75/100 READY | Sửa rule: failed CI/check là hard gate, risk phải BLOCKED |
| 4 | Sơ đồ React Flow tự căn chỉnh (fitView) bị lỗi do thuộc tính `measured` chưa sẵn sàng | Nút "Fit view" không phóng to thu nhỏ đúng tâm sau khi ELK tính toán xong | Tính toán bounding box thủ công từ tọa độ và kích thước ELK, dùng fitBounds |
| 5 | Lỗi "could not determine data type of parameter" trên PostgreSQL khi JPQL nhận tham số Null | Chạy ứng dụng và tìm kiếm với các filter trống bị lỗi JPA SQL | Tách Dynamic JPQL thành 6 query tĩnh riêng biệt để PostgreSQL suy luận đúng kiểu dữ liệu |

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
Em kiểm chứng kết quả AI bằng cách đọc lại codebase thật trước khi áp dụng, kiểm tra schema Flyway, chạy backend compile/test, chạy frontend build khi có thay đổi UI và manual test một số tình huống chính. Với RTM, em kiểm tra module chỉ đọc dữ liệu từ bảng khác. Với Sprint, em kiểm tra rule overlap/active sprint và việc assign task. Với Code Insight, em kiểm tra từng phase bằng targeted test và full Maven test, đồng thời manual test failed CI để phát hiện risk rule sai.
```

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Mô tả phần sinh viên tự làm, phần AI hỗ trợ và phần đã tự cải tiến.

```text
Phần cá nhân của em tập trung vào backend/frontend cho RTM, Sprint Weekly Planning và Code Insight, kèm tài liệu milestone/Jira/AI audit cá nhân. AI hỗ trợ em phân tích hướng đi, chia phase, gợi ý code và test. Em tự kiểm tra lại bằng codebase, chỉnh scope, xử lý merge, chạy test và sửa các lỗi nghiệp vụ như Sprint overlap hoặc Code Insight failed CI risk.
```

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| Phạm Duy Hưng | DE190330 | Requirement/use case/test/evidence/UI liên quan | Có | Git commits theo author `Phạm Duy Hưng`, folder cá nhân |
| Nguyễn Thành Đạt | DE190465 | Auth, project workspace, notification, GitHub/Issue Tracker | Có | Git commits theo author `Nguyen Thanh Dat`, module issue tracker/github |
| Nguyễn Lê Trung Tín | DE190364 | Task/Kanban, weekly report/SLA/daily-weekly UI | Có | Git commits theo author `Tinnguyen13-7` |
| Trần Công Tú | DE190313 | Requirement/use case/ERD/seed/evidence liên quan | Có | Git commits theo author `TuTran205` |
| Nguyễn Minh Hiếu | DE200322 | RTM, Sprint Weekly Planning, Code Insight, milestone/Jira/AI logs | Có | Git commits theo author `hieu2816`, `Nguyen_Minh_Hieu/*` |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
AI hỗ trợ em nhiều nhất ở việc phân tích hướng đi, chia module thành các phase nhỏ, review kiến trúc và debug. Với các phần nhiều liên kết như RTM và Code Insight, AI giúp em không bỏ sót luồng dữ liệu giữa requirement, task, test, bug, evidence và GitHub evidence.
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
Em không dùng các gợi ý làm AI Engine quá lớn hoặc auto-approve task. Em cũng không dùng semantic matching tự động cho evidence linking vì dễ link sai task. Những phần đó để sau hoặc chỉ làm local summary vì project hiện tại cần ổn định và giải thích được trước.
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
Em chạy compile/test, đọc migration, đọc service/repository thật, manual test UI và so sánh với rule nghiệp vụ. Nếu thay đổi chạm module bạn khác như GitHub Integration hoặc Task, em giữ API/behavior cũ và test regression trước.
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Khó nhất là Code Insight vì nó liên quan nhiều phần: Task review, GitHub webhook, commit/PR/CI evidence, scoring, audit snapshot và dashboard. Nếu không có AI hỗ trợ chia phase và review rủi ro thì rất dễ làm quá rộng hoặc merge sai với Issue Tracker.
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
Em hiểu rõ hơn cách làm project theo quy trình: requirement phải trace được sang task, test, bug và evidence; code cần có migration, API, test và changelog; khi làm nhóm phải tôn trọng ownership module của nhau.
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
Em học được là AI chỉ nên là người hỗ trợ phân tích và review. Mọi kết quả AI phải được kiểm tra lại bằng code/test/evidence. Khi ghi audit, phải nói rõ phần nào AI hỗ trợ, phần nào mình chỉnh sửa, và không ghi những việc chưa làm như đã hoàn thành.
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
| Nguyễn Minh Hiếu | 01/07/2026 |
