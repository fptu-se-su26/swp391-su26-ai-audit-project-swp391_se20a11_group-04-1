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
| Ngày hoàn thành | 08/06/2026 (bản cập nhật hiện tại) |

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
Em đang setup backend Spring Boot cho DevTrack AI, dùng PostgreSQL và Flyway. Hãy review giúp cấu trúc cơ bản nên có những gì: controller, service, repository, entity, dto, migration. Em muốn làm đúng convention để sau này các module như RTM, Sprint, Code Insight không bị rối.
```

#### 4.2. Kết quả AI gợi ý

```text
AI gợi ý giữ kiến trúc nhiều lớp, tạo migration riêng bằng Flyway, không sửa migration cũ sau khi đã chạy, dùng DTO cho API và tách business rule vào service.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em áp dụng hướng layered architecture và Flyway migration cho backend foundation.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em tự kiểm tra lại dependency, cấu hình PostgreSQL và convention của nhóm. Các module sau đều bám theo kiểu controller mỏng, service xử lý logic, repository đọc/ghi database.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/a9ba9d2 |
| File liên quan | `code/backend/pom.xml`, `code/backend/src/main/resources/db/migration` |
| Screenshot | Chụp prompt số 3 |
| Kết quả chạy/test | Backend foundation được dùng cho các test module sau |
| Link video demo | Chưa có |
| Ghi chú khác | Đây là nền kỹ thuật, chưa phải feature hoàn chỉnh |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em thấy AI hữu ích nhất ở phần nhắc convention. Nếu ban đầu làm migration lung tung hoặc để logic trong controller thì các module sau rất khó merge.
```

---

### Lần sử dụng AI số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 21/05/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Tạo bộ nhớ handoff và log AI cá nhân |
| Phần việc liên quan | Report / AI Audit |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Bạn đọc project hiện tại, rồi tạo giúp tôi vài file local để ghi lại context quan trọng qua từng lần làm việc với AI. Tôi không muốn lưu mọi prompt, chỉ muốn log các quyết định lớn, module nào đã làm, kỹ thuật gì đã dùng, và hướng handoff cho agent khác sau này.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất ba file: AI_PROJECT_CONTEXT_LOG.md để ghi quyết định/prompt lớn, MODULE_IMPLEMENTATION_TECHNIQUE_LOG.md để ghi stage kỹ thuật, và AGENT_HANDOFF_GUIDE.md để agent sau đọc trước khi làm tiếp.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng ba file này làm bộ nhớ cá nhân để sau mỗi giai đoạn có thể tổng hợp lại AI audit, prompt log, changelog và reflection.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em yêu cầu các file này để local và được ignore, vì đây là ghi chú làm việc cá nhân chứ không phải tài liệu nộp trực tiếp. Khi cần nộp, em chỉ chọn lọc lại nội dung phù hợp.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Không commit trực tiếp vì file handoff là local/ignored |
| File liên quan | `Nguyen_Minh_Hieu/AI_PROJECT_CONTEXT_LOG.md`, `MODULE_IMPLEMENTATION_TECHNIQUE_LOG.md`, `AGENT_HANDOFF_GUIDE.md` |
| Screenshot | Chụp prompt số 4 |
| Kết quả chạy/test | Không áp dụng |
| Link video demo | Chưa có |
| Ghi chú khác | Các file này là nguồn để tổng hợp 15 log hiện tại |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em nhận ra nếu không ghi lại từng giai đoạn thì đến cuối dự án rất khó nhớ AI đã hỗ trợ phần nào. File handoff giúp em không bị mất context khi chuyển qua chat khác.
```

---

### Lần sử dụng AI số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 22/05/2026 |
| Công cụ AI | Codex / Stitch |
| Mục đích sử dụng | Implement RTM live matrix và snapshot |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Tôi muốn implement module RTM theo plan đã thống nhất. RTM chỉ đọc dữ liệu từ requirement, task, test case, bug và evidence, không được tự sửa dữ liệu của module khác. Backend cần API live matrix, summary, detail và snapshot. Frontend theo feature-based structure và có thể tham khảo UI Stitch, nhưng phải khớp app hiện tại.
```

#### 4.2. Kết quả AI gợi ý

```text
AI triển khai hướng RTM read-only, dùng aggregation từ các bảng hiện có, tính status NOT_STARTED, IN_PROGRESS, AT_RISK, DONE và lưu snapshot dạng JSONB.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng logic RTM read-only, API `/api/v1/projects/{projectId}/rtm`, frontend `features/rtm` và route `/traceability-matrix`.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em kiểm tra lại schema thật trước khi nối bảng. Vì RTM chạm dữ liệu của Requirement, Task, Test Case, Bug và Evidence nên em giữ nguyên quyền sở hữu module khác, chỉ đọc và tổng hợp, không tạo hoặc sửa artifact thay module của bạn khác.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/0301fe8 |
| File liên quan | `RtmController.java`, `RtmServiceImpl.java`, `code/frontend/src/features/rtm`, `routes/index.jsx` |
| Screenshot | Chụp RTM page và prompt số 5 |
| Kết quả chạy/test | `./mvnw.cmd test` passed 34 tests; `npm run build` passed ngày 22/05/2026 |
| Link video demo | Chưa có |
| Ghi chú khác | Có thêm fix task route/status sau đó ở commit `ee0e288`, `ce74907` để UI thao tác task không bị redirect |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em học được cách làm module tổng hợp dữ liệu mà không phá ownership của module khác. RTM nhìn đơn giản trên UI nhưng backend phải cẩn thận vì nó phụ thuộc nhiều bảng.
```

---

### Lần sử dụng AI số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Implement Sprint Weekly Planning |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Dựa vào tài liệu bổ sung, hãy implement Sprint module nhưng chọn hướng Weekly + Sprint Planning View trước. Sprint chỉ quản lý sprint, assign task có sẵn vào sprint và plan ngày làm trong tuần. Không làm Daily View riêng và không làm AI Audit Tracker trong app v1.
```

#### 4.2. Kết quả AI gợi ý

```text
AI triển khai Sprint CRUD, cập nhật trạng thái sprint, assign/remove task khỏi sprint, lưu `tasks.sprint_plan_date`, tính progress/capacity và giao diện weekly planner drag/drop.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng backend SprintController/SprintServiceImpl, migration thêm field sprint planning, frontend `features/sprint` và route `/projects/:projectId/sprints`.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em giữ rule là Sprint không tạo task mới. Task Board vẫn là nơi tạo/sửa task. Sprint chỉ là timebox để lên kế hoạch task, tránh trùng trách nhiệm với module Task/Kanban của thành viên khác.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/fb46446 |
| File liên quan | `SprintController.java`, `SprintServiceImpl.java`, `V20260527110000__add_sprint_planning_fields.sql`, `code/frontend/src/features/sprint` |
| Screenshot | Chụp Sprint page/Weekly Planner và prompt số 6 |
| Kết quả chạy/test | Backend compile/test passed ngày 27/05/2026; frontend parser check passed; Vite build bị `spawn EPERM` trong sandbox |
| Link video demo | Chưa có |
| Ghi chú khác | Commit `9d5a16f` fix `updatedAt` hiển thị UI sprint |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Phần này giúp em hiểu rõ hơn Sprint là timebox cho task, không phải deadline trực tiếp của requirement. Nếu UI không giải thích rõ thì người dùng dễ hiểu nhầm đang kéo requirement.
```

---

### Lần sử dụng AI số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 29/05/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Harden business rule Sprint và hỗ trợ merge |
| Phần việc liên quan | Backend / Frontend / Debug |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Review giúp tôi các rule Sprint hiện tại. Tôi muốn tránh overlap sprint, chỉ có một active sprint trong một project, không cho API lấy task từ sprint khác, và weekly planner phải sync lại khi đổi sprint hoặc đổi tuần. Nếu có conflict với develop thì ưu tiên giữ đúng behavior task/sprint hiện tại.
```

#### 4.2. Kết quả AI gợi ý

```text
AI gợi ý thêm query kiểm tra overlap, validate một ACTIVE sprint, chặn reassign task thuộc sprint khác qua API, parse status bắt buộc và reset weekStart trên frontend.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em áp dụng vào SprintRepository, SprintServiceImpl và WeeklyPlanner để rule sprint ổn định hơn trước khi merge.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em phân biệt `findSprintsOverlappingWeek` dùng để hiển thị sprint trong tuần với `existsOverlappingSprint` dùng để chặn sprint-vs-sprint overlap. Việc này tránh xóa nhầm logic cần cho Weekly View.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/0793eb4 |
| File liên quan | `SprintRepository.java`, `SprintServiceImpl.java`, `WeeklyPlanner.jsx` |
| Screenshot | Chụp prompt số 7 và PR/merge evidence nếu cần |
| Kết quả chạy/test | Backend compile có resources skipped passed; parser check frontend passed |
| Link video demo | Chưa có |
| Ghi chú khác | Có merge commit `566accf`, `b4d881f` để tích hợp develop vào nhánh Sprint |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em học được rằng feature chạy được chưa chắc rule đã đúng. Những rule nhỏ như active sprint hay overlap nếu không chặn ở service thì UI có đẹp cũng vẫn sai dữ liệu.
```

---

### Lần sử dụng AI số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Codex / ChatGPT |
| Mục đích sử dụng | Chuẩn bị use case diagram và script thuyết trình Module 5 |
| Phần việc liên quan | Report / Presentation |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Tôi cần làm phần use case diagram cho Module 5 gồm RTM, Code Insight và Mentor Review. Hãy review giúp actor nào nên để ngoài system boundary, actor nào không nên để. Sau đó viết giúp tôi script tiếng Việt ngắn để thuyết trình khoảng 4 slide.
```

#### 4.2. Kết quả AI gợi ý

```text
AI phân tích rằng generic System không nên là actor, GitHub System là external actor, AI Engine có thể là external actor nếu xem như dịch vụ AI ngoài, còn Code Insight là module nội bộ.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng phần phân tích actor-boundary để chỉnh use case diagram và dùng script tiếng Việt làm phần nói cho milestone.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em chọn lại phiên bản diagram có group màu vì dễ trình bày hơn. Script cũng được chỉnh lại theo giọng nói của mình, không đọc y nguyên như văn bản AI.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Tài liệu nằm ngoài repo theo quy tắc lưu trữ tài liệu cá nhân |
| File liên quan | `D:/Semester_5/SWP391/Project/05_part5_usecase_diagrams.md`, `D:/Semester_5/SWP391/Project/module5_presentation_script.md` |
| Screenshot | Chụp Mermaid diagram/script và prompt số 8 |
| Kết quả chạy/test | Không áp dụng vì là tài liệu |
| Link video demo | Chưa có |
| Ghi chú khác | Dùng để chuẩn bị milestone, không phải code feature |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em thấy AI giúp nhanh ở phần giải thích UML, nhưng diagram cuối cùng phải tự chọn theo cách mình trình bày được. Nếu đưa actor sai thì lúc thuyết trình sẽ bị hỏi rất khó trả lời.
```

---

### Lần sử dụng AI số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Backfill Jira task từ git history và codebase |
| Phần việc liên quan | Project tracking / Report |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Nhóm em chưa maintain Jira từ đầu. Bạn hãy đọc git history, codebase hiện tại, các folder log/audit của từng thành viên và tài liệu planning để dựng lại task Jira hợp lý. Chỉ ghi task có evidence thật, có assignee, file/commit liên quan và acceptance criteria. Đừng tự bịa future task.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đọc commit, module backend/frontend, tài liệu planning và folder từng thành viên để tạo backlog Jira dạng backfill. Bản đầu có nhiều issue, sau đó được gộp còn 32 issue Done có evidence.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng breakdown này để cập nhật Jira/tracking lại cho nhóm, bao gồm cả việc planning, ERD, use case, code và report.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em yêu cầu bỏ các task Planned chưa có bằng chứng, chỉ giữ task đã làm hoặc có evidence. Em cũng nhắc project date thật là 11/05/2026 đến 24/07/2026, nhưng trong log nộp hiện tại không ghi việc tương lai như đã hoàn thành.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Dựa trên git history toàn repo đến 30/05/2026 |
| File liên quan | `D:/Semester_5/SWP391/Project/project_tailieu/jira_backfill_task_breakdown.md` |
| Screenshot | Chụp prompt số 9 và file Jira breakdown |
| Kết quả chạy/test | Không áp dụng |
| Link video demo | Chưa có |
| Ghi chú khác | Có giải thích ambiguity ngày tháng và không ghi task tương lai là Done |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em học được là tracking phải đi kèm evidence. Nếu cuối kỳ mới dựng lại Jira thì vẫn làm được, nhưng phải dựa vào commit/file thật chứ không thể ghi theo trí nhớ.
```

---

### Lần sử dụng AI số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Debug seed data, Redis cache và HashGeneratorRunner |
| Phần việc liên quan | Backend / Debug / Database |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Tôi seed data trực tiếp bằng pgAdmin, bảng projects và project_members có dữ liệu rồi nhưng UI My Projects vẫn không thấy project. Bạn kiểm tra giúp khả năng do backend cache hay lỗi membership. Ngoài ra file HashGeneratorRunner đang làm gì, có ảnh hưởng khi chạy app không?
```

#### 4.2. Kết quả AI gợi ý

```text
AI xác định project list có Redis cache theo user/page/filter nên direct SQL insert không tự clear cache. AI cũng chỉ ra HashGeneratorRunner chỉ là helper tạo BCrypt hash nhưng đang chạy cùng app vì có @Component.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng hướng debug cache Redis và xác nhận seed data trong database. Sau đó cleanup HashGeneratorRunner để tránh rủi ro startup do hard-coded path.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em kiểm tra lại user id, project id và membership bằng pgAdmin. Việc xóa HashGeneratorRunner là cleanup runtime, không phải business feature.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/8ba65de |
| File liên quan | `ProjectServiceImpl.java`, `HashGeneratorRunner.java` trước khi cleanup |
| Screenshot | Chụp prompt số 10, pgAdmin/Redis nếu cần |
| Kết quả chạy/test | Debug thủ công bằng database/cache |
| Link video demo | Chưa có |
| Ghi chú khác | Redis có thể cần `FLUSHDB` hoặc xóa key `projects:user:*` sau khi seed trực tiếp |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em rút kinh nghiệm là nếu dữ liệu được insert ngoài app thì cache có thể làm UI nhìn như chưa có dữ liệu. Còn class helper để @Component rất nguy hiểm vì nó chạy ở mọi máy.
```

---

### Lần sử dụng AI số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex / ChatGPT |
| Mục đích sử dụng | Viết lại kiến trúc Code Insight |
| Phần việc liên quan | Design / Report / Backend planning |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Hãy đọc lại report Code Insight hiện tại và viết lại cho dễ hiểu hơn. Tôi muốn kiến trúc không phụ thuộc hoàn toàn vào AI, có GitHub evidence, rule-based scoring, leader approval gate, audit snapshot, secret redaction, webhook async và ví dụ cụ thể để thầy cô dễ hiểu.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất kiến trúc Code Insight dựa trên GitHub evidence + rule score + AI review có giới hạn + leader là người quyết định cuối. Report được viết lại theo workflow, database/API/UI, scoring example, risk handling và implementation phase.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng kiến trúc này làm hướng chính cho các commit Code Insight sau đó, bắt đầu từ review gate rồi mới tới GitHub evidence và AI summary.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em quyết định không để AI auto-approve task. AI chỉ gợi ý hoặc tóm tắt, còn Leader vẫn là người approve/reject để phù hợp yêu cầu minh bạch.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Tài liệu kiến trúc nằm ngoài repo code |
| File liên quan | `D:/Semester_5/SWP391/Project/Code_Insight_Module_Architecture_Report.md` |
| Screenshot | Chụp prompt số 11 và đoạn architecture report |
| Kết quả chạy/test | Không áp dụng ở bước report |
| Link video demo | Chưa có |
| Ghi chú khác | Report này trở thành blueprint cho phase Code Insight |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em hiểu thêm là module có chữ AI không nên để AI quyết định hết. Với project học thuật, quan trọng là có evidence và giải thích được vì sao task được approve.
```

---

### Lần sử dụng AI số 12

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Implement Code Insight review gate và project config |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Bắt đầu Code Insight bằng slice nhỏ trước: task review gate MVP. Khi member chuyển task sang DONE, nếu project bật review gate thì task phải vào queue để leader approve/reject. Sau đó thêm project config cho Code Insight, gồm reviewGateEnabled và warning threshold. Đừng làm GitHub evidence hay AI vội.
```

#### 4.2. Kết quả AI gợi ý

```text
AI triển khai task review decisions, API approve/reject, config backend/frontend và kết nối review gate vào TaskServiceImpl.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng review gate làm nền cho Code Insight. Đây là điểm móc để evidence và AI review ở các phase sau hỗ trợ leader ra quyết định.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em chia commit theo nhóm vừa phải: review gate, config backend, setting UI và fix edit flow. Như vậy PR dễ review hơn và không gom tất cả Code Insight thành một commit lớn.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `4558e65`, `fbf504d`, `0345985`, `6a9fd4d`, `14b8c12` |
| File liên quan | `CodeInsightController.java`, `CodeInsightServiceImpl.java`, `TaskServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Chụp review queue/config UI và prompt số 12 |
| Kết quả chạy/test | Backend compile/test theo log module; frontend build chạy ngoài sandbox |
| Link video demo | Chưa có |
| Ghi chú khác | Review gate chưa có GitHub evidence ở phase này |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em thấy làm theo slice nhỏ dễ kiểm soát hơn. Nếu nhảy thẳng vào AI review thì sẽ khó biết lỗi nằm ở workflow, GitHub hay AI.
```

---

### Lần sử dụng AI số 13

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 03/06/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Merge Code Insight với shared GitHub Integration |
| Phần việc liên quan | Backend / Frontend / Refactor |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Develop vừa có Issue Tracker GitHub config. Tôi không muốn Code Insight giữ một GitHub config riêng nữa. Hãy resolve merge theo hướng dùng chung github_integrations của Issue Tracker, xóa phần duplicate của Code Insight nếu cần, nhưng không được làm hỏng behavior Issue Tracker.
```

#### 4.2. Kết quả AI gợi ý

```text
AI đề xuất dùng `github_integrations` làm source of truth, bỏ các class/table GitHub config riêng của Code Insight, thêm cleanup migration và sửa Code Insight config đọc shared integration.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em áp dụng hướng dùng chung GitHub Integration để Code Insight không duplicate với Issue Tracker.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Vì phần GitHub Integration ban đầu thuộc luồng Issue Tracker của bạn khác, em giữ API/behavior Issue Tracker và chỉ refactor phần Code Insight để dựa vào shared integration. Đây là chỗ có chạm module khác nên em xử lý theo hướng bảo toàn behavior cũ.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/786ec38 |
| File liên quan | `CodeInsightServiceImpl.java`, `V20260603152000__remove_duplicate_code_insight_github_config.sql`, `CodeInsightPage.jsx`, `Sidebar.jsx`, `routes/index.jsx` |
| Screenshot | Chụp prompt số 13 và GitHub Config tab |
| Kết quả chạy/test | Kiểm tra compile/test sau refactor các phase GitHub |
| Link video demo | Chưa có |
| Ghi chú khác | Giải thích rõ đây là refactor integration, không đổi chức năng Issue Tracker |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em học được là khi làm module mới mà thấy có phần trùng với module bạn khác thì nên dùng chung foundation, không tạo hệ thống song song. Nếu để hai config GitHub sẽ rất khó bảo trì.
```

---

### Lần sử dụng AI số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 04/06/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Implement GitHub evidence ingestion, linking, scoring và evidence drawer |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Tiếp tục Code Insight theo architecture report. Phase này cần lưu GitHub code evidence từ webhook push, pull_request, workflow_run, check_run; sau đó link evidence vào task bằng task key hoặc GitHub issue rõ ràng. Tiếp theo scoring phải dùng được commit/PR/CI evidence và UI leader có drawer xem evidence. Làm từng phần đơn giản, có test, không gọi AI ở phase này.
```

#### 4.2. Kết quả AI gợi ý

```text
AI triển khai storage cho GitHub commits, PR, check runs, raw webhook events; dispatcher/handler cho các event; evidence link deterministic; scoring V2 có GitHub signals; và drawer metadata cho leader xem issue/PR/commit/CI.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng các phase GitHub evidence để Code Insight có dữ liệu thật trước khi thêm AI summary. Review queue bắt đầu có score, risk, warning, evidence count và drawer chi tiết.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em giữ rule linking bảo thủ: chỉ auto-link khi commit/PR có `TASK-12`, `TSK-12`, `task-12` hoặc GitHub issue number khớp task. Không dùng requirement code hay AI semantic matching để tránh link sai.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `b933a0f`, `10e5007`, `c619e1a`, `3a6eda8` |
| File liên quan | `GitHubEvidenceServiceImpl.java`, `GitHubWebhookDispatcherImpl.java`, `CodeInsightEvidenceLinkServiceImpl.java`, `CodeInsightScoringServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Chụp review queue/evidence drawer và prompt số 14 |
| Kết quả chạy/test | Full backend test passed 82, 88, 91, 93 tests theo từng phase ngày 04/06/2026; frontend build passed ngoài sandbox |
| Link video demo | Chưa có |
| Ghi chú khác | Có chạm shared GitHub core nhưng giữ compatible facade/API cũ |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Phần này là lúc em thấy rõ giá trị của evidence. Nếu chỉ có score không có commit/PR/CI thì leader khó tin. Nhưng auto-link cũng phải rất cẩn thận vì link sai còn nguy hiểm hơn không link.
```

---

### Lần sử dụng AI số 15

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 04/06/2026 - 07/06/2026 |
| Công cụ AI | Codex |
| Mục đích sử dụng | Hoàn thiện Code Insight patch, AI review summary, audit snapshot, dashboard và fix CI risk |
| Phần việc liên quan | Backend / Frontend / Testing / Debug |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Tiếp tục Code Insight Phase 6-9. Tôi cần fetch changed files của PR khi leader mở evidence, tạo AI review summary dạng local/safe vì chưa có provider thật, lưu audit snapshot khi approve/reject và thêm dashboard metrics. Sau đó nếu test manual thấy failed CI mà vẫn READY thì sửa risk rule để failed CI phải BLOCKED.
```

#### 4.2. Kết quả AI gợi ý

```text
AI triển khai fetch/cache changed files, local AI review summary, review snapshots, dashboard metrics và sau đó sửa rule failed CI thành hard risk gate. Numeric score vẫn giữ để tham khảo nhưng READY không được xuất hiện khi có CI failed.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Em dùng các phần này để hoàn thiện luồng leader review: xem changed files, xem AI summary, approve/reject có snapshot, dashboard có metric và risk CI đúng hơn.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Em giới hạn AI review là local structured summary, không gọi external LLM và không auto-approve. Khi manual test case failed CI vẫn READY, em yêu cầu sửa logic vì đây là lỗi nghiệp vụ nghiêm trọng trong review gate.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `f92a255`, `87eee37`, `41bfb06`, `db2c023`, `a39808f`, `d7b59b0` |
| File liên quan | `CodeInsightPatchServiceImpl.java`, `CodeInsightAiReviewServiceImpl.java`, `CodeInsightReviewSnapshotServiceImpl.java`, `CodeInsightServiceImpl.java`, `CodeInsightScoringServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Chụp dashboard/evidence drawer/failed CI case và prompt số 15 |
| Kết quả chạy/test | `./mvnw.cmd test` passed 93 tests ngày 04/06/2026; `.\mvnw.cmd "-Dtest=CodeInsightScoringServiceImplTest" test` passed ngày 05/06/2026; commit fix CI head ngày 07/06/2026 |
| Link video demo | Chưa có |
| Ghi chú khác | Đây là giai đoạn gần nhất trong timeline hiện tại, không ghi vượt các việc sau 08/06/2026 |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Em học được là AI summary chỉ nên hỗ trợ leader đọc nhanh, không thay thế kiểm tra thật. Rule failed CI cũng cho thấy phải test manual, vì score 75/100 nhìn có vẻ ổn nhưng nghiệp vụ review thì vẫn phải blocked.
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
| Nguyễn Minh Hiếu | 08/06/2026 |
