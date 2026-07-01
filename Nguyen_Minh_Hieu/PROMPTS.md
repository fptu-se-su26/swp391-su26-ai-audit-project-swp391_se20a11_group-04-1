# Prompt Log

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | SWP391 |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | DevTrack AI |
| Tên sinh viên / Nhóm | Nguyễn Minh Hiếu - Nhóm 4 |
| MSSV / Danh sách MSSV | DE200322 |
| Giảng viên hướng dẫn | Chưa cập nhật |
| Ngày bắt đầu | 11/05/2026 |
| Ngày cập nhật gần nhất | 01/07/2026 |

---

## 2. Mục đích của file Prompt Log

File này dùng để ghi lại các prompt quan trọng đã sử dụng trong quá trình thực hiện bài tập, lab, assignment hoặc project.

Sinh viên/nhóm cần ghi lại:

- Đã hỏi AI điều gì.
- Mục đích sử dụng prompt.
- Công cụ AI đã sử dụng.
- AI đã trả lời hoặc gợi ý gì.
- Kết quả đó có được áp dụng vào bài hay không.
- Sinh viên/nhóm đã kiểm tra, chỉnh sửa hoặc cải tiến gì sau khi nhận kết quả từ AI.

---

## 3. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng.

- [x] ChatGPT
- [x] Gemini
- [x] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [ ] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [x] Công cụ khác: Codex, Stitch

---

## 4. Bảng tổng hợp prompt đã sử dụng

| STT | Ngày | Công cụ AI | Mục đích | Prompt tóm tắt | Kết quả chính | Có sử dụng vào bài không? | Minh chứng |
|---:|---|---|---|---|---|---|---|
| 1 | 11/05/2026 | ChatGPT | Brainstorm project | Tìm ý tưởng project 9 tuần có AI cho sinh viên IT | Chọn hướng DevTrack AI, tập trung traceability/evidence | Có | README, tài liệu project |
| 2 | 12/05/2026 | ChatGPT | Requirement/use case/ERD | Phân tích requirement-centric workflow | Actor, use case, entity chính | Có | usecase/ERD/migration |
| 3 | 17/05/2026 | ChatGPT/Codex | Setup Spring Boot foundation | setup Spring Boot/PostgreSQL/Flyway | Layered architecture và database schema | Có | commit `a9ba9d2` |
| 4 | 22/05/2026 | Codex/Stitch | RTM implementation | Implement RTM read-only live matrix/snapshot | Backend API + frontend RTM page | Có | commit `0301fe8` |
| 5 | 27/05/2026 | Codex | Sprint Weekly Planning | Implement sprint planning theo weekly view | Sprint CRUD, assign task, weekly planner | Có | commit `fb46446` |
| 6 | 29/05/2026 | Codex | Sprint debug/rule | Harden overlap/active sprint/reassign task | Rule service và UI sync ổn hơn | Có | commit `0793eb4` |
| 7 | 30/05/2026 | Codex/ChatGPT | Use case boundary | Phân định ranh giới hệ thống UML Use Case | Làm rõ ranh giới Actor/System, thuyết trình milestone | Có | file report ngoài repo |
| 8 | 30/05/2026 | Codex | Jira backfill | Dựng Jira task từ git/codebase/evidence | 32 issue Done có evidence | Có | `jira_backfill_task_breakdown.md` |
| 9 | 30/05/2026 | Codex/ChatGPT | Code Insight architecture | Thiết kế kiến trúc phê duyệt Code Insight local | GitHub evidence + local rule scoring + snapshots | Có | architecture report |
| 10 | 01/06/2026 | Codex | Review gate/config | Implement Code Insight review gate MVP | Task review decision + config UI | Có | commits `4558e65`, `fbf504d` |
| 11 | 03/06/2026 | Codex | GitHub integration merge | Dùng shared GitHub Integration, bỏ duplicate | Code Insight dùng `github_integrations` | Có | commit `786ec38` |
| 12 | 04/06/2026 | Codex | Evidence/scoring/drawer | Ingest GitHub evidence, link task, scoring V2 | Commit/PR/CI evidence + evidence drawer | Có | commits `b933a0f`..`3a6eda8` |
| 13 | 04-07/06/2026 | Codex | Code Insight phase 6-9/fix | Triển khai files cache, AI review local, snapshots, dashboard | Hoàn thiện review flow và fix failed CI BLOCKED | Có | commits `f92a255`..`d7b59b0` |
| 14 | 14/06/2026 | Gemini/Codex | Alternative Evaluation | Thảo luận thiết kế Gate Result, Confidence, Risk | Đổi sang mô hình Gate Result/Confidence + RTM sync | Có | `AI_PROJECT_CONTEXT_LOG.md` |
| 15 | 16-17/06/2026 | Gemini/Codex | Refactor/WebSocket/SSE | WebSocket fix, Gemini gộp, refactor namespace, SSE, manual links | Task Review namespace, SSE stream, manual link | Có | commits `f3e589a`..`02c89f5` |
| 16 | 23-30/06/2026 | Gemini/Antigravity | AWS Architecture Viz | Sơ đồ AWS, MongoDB overrides, ELK layout, exporters, Legend | Sơ đồ AWS lưu Mongo, xuất Draw.io/ảnh, legend, fitBounds | Có | commit `[DE200322] feat: upgrade...` |
| 17 | 01/07/2026 | Antigravity | Admin Project Module | Thống kê, tìm kiếm, phân trang, khóa dự án, soft delete, JPQL fix | Admin Project module, JPQL type fix, soft delete | Có | commit `[DE200322] feat: implement...` |

---

## 5. Prompt chi tiết

> Sinh viên/nhóm có thể nhân bản mẫu “Prompt số...” nhiều lần tùy số lượng prompt thực tế đã sử dụng.

---

### Prompt số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 11/05/2026 |
| Công cụ AI | ChatGPT |
| Mục đích | Brainstorm ý tưởng project |
| Phần việc liên quan | Requirement / Design |
| Mức độ sử dụng | Hỏi ý tưởng |

#### 5.1. Prompt nguyên văn

```text
Brainstorm cho tôi một ý tưởng project 9 tuần cho nhóm 5 người, có AI integration, scope vừa đủ lớn nhưng không quá nặng. Tập trung vào painpoint thật của sinh viên, đặc biệt là nhóm ngành sinh viên IT, phân tích các trường hợp mà nhóm có thể giải quyết được. Đưa ra nhiều lựa chọn khác nhau, phân tích điểm mạnh và điểm yếu của từng lựa chọn.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Lúc này nhóm mới bắt đầu project, chưa muốn chọn đề tài quá chung như task management bình thường. Em muốn có một ý tưởng vừa có AI, vừa đúng vấn đề sinh viên IT hay gặp khi làm project nhóm.
```

#### 5.3. Kết quả AI trả về

```text
AI gợi ý nhiều hướng, trong đó hướng workspace cho nhóm sinh viên IT có traceability và evidence là hợp nhất với môn SWP391.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Nhóm chọn hướng DevTrack AI, tập trung vào quản lý project theo requirement và evidence.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Nhóm bỏ bớt các ý tưởng quá rộng và quyết định đi theo flow Requirement -> Use Case -> Task -> Test Case -> Bug -> Evidence -> RTM -> Report.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | README/project setup history |
| File liên quan | `README.md`, tài liệu tổng hợp dự án |
| Screenshot | Prompt số 1 trong file minh chứng |
| Kết quả chạy/test | Không áp dụng |
| Link tài liệu/báo cáo | `D:/Semester_5/SWP391/Project/project_tailieu` |
| Ghi chú khác | Prompt dùng để chọn hướng ban đầu |

#### 5.8. Ghi chú thêm

```text
Prompt này quan trọng vì nó quyết định hướng đề tài, nhưng phần scope cuối vẫn do nhóm tự chọn.
```

---

### Prompt số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/05/2026 |
| Công cụ AI | ChatGPT |
| Mục đích | Phân tích requirement, use case và ERD |
| Phần việc liên quan | Requirement / Design / Database |
| Mức độ sử dụng | Hỏi review / Hỏi giải thích |

#### 5.1. Prompt nguyên văn

```text
Từ ý tưởng DevTrack AI, hãy phân tích giúp tôi requirement và use case chính. Tôi muốn hệ thống đi theo hướng requirement-centric, nghĩa là requirement phải trace được sang use case, task, test case, bug và evidence. Sau đó gợi ý luôn các entity database chính, nhưng đừng làm quá phức tạp vì nhóm em là sinh viên năm 2.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Sau khi có ý tưởng, nhóm cần chuyển nó thành requirement, use case và database sơ bộ để chia module cho từng thành viên.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất actor, use case và entity chính như Requirement, UseCase, Task, TestCase, BugReport, Evidence và RTMSnapshot.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Nhóm dùng các entity và luồng chính để thiết kế tài liệu requirement/use case và schema ban đầu.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Nhóm giảm bớt các phần AI Engine quá lớn, ưu tiên module có thể làm trong thời gian môn học.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `a9ba9d2` và migration liên quan |
| File liên quan | `V20260517112000__Init_database.sql`, `usecase.md` |
| Screenshot | Prompt số 2 |
| Kết quả chạy/test | Không áp dụng |
| Link tài liệu/báo cáo | `D:/Semester_5/SWP391/Project/project_tailieu` |
| Ghi chú khác | Dùng làm nền phân tích |

#### 5.8. Ghi chú thêm

```text
Prompt này giúp tránh thiết kế rời rạc giữa requirement và các artifact phía sau.
```

---

### Prompt số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 17/05/2026 |
| Công cụ AI | ChatGPT / Codex |
| Mục đích | Setup backend foundation |
| Phần việc liên quan | Database / Coding |
| Mức độ sử dụng | Hỏi giải thích / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Em đang setup backend Spring Boot cho DevTrack AI, dùng PostgreSQL và Flyway. Hãy review giúp cấu trúc cơ bản nên có những gì: controller, service, repository, entity, dto, migration. Em muốn làm đúng convention để sau này các module như RTM, Sprint, Code Insight không bị rối.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Chuẩn bị viết code backend. Nhóm cần thống nhất cấu trúc project để khi nhiều người cùng làm việc trên các module khác nhau không bị conflict cấu trúc thư mục.
```

#### 5.3. Kết quả AI trả về

```text
AI gợi ý giữ kiến trúc nhiều lớp, tạo migration riêng bằng Flyway, không sửa migration cũ sau khi đã chạy, dùng DTO cho API và tách business rule vào service.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em áp dụng hướng layered architecture và Flyway migration cho backend foundation.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em tự kiểm tra lại dependency, cấu hình PostgreSQL và convention của nhóm. Các module sau đều bám theo kiểu controller mỏng, service xử lý logic, repository đọc/ghi database.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/a9ba9d2 |
| File liên quan | `code/backend/pom.xml`, `code/backend/src/main/resources/db/migration` |
| Screenshot | Chụp prompt số 3 |
| Kết quả chạy/test | Backend foundation được dùng cho các test module sau |
| Link tài liệu/báo cáo | Tài liệu convention nhóm |
| Ghi chú khác | Đây là nền kỹ thuật, chưa phải feature hoàn chỉnh |

#### 5.8. Ghi chú thêm

```text
Convention này giúp codebase giữ được sự gọn gàng cho đến cuối kỳ.
```

---

### Prompt số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 22/05/2026 |
| Công cụ AI | Codex / Stitch |
| Mục đích | Triển khai RTM live matrix và lưu trữ snapshot |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỏi sinh code / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Tôi muốn implement module RTM theo plan đã thống nhất. RTM chỉ đọc dữ liệu từ requirement, task, test case, bug và evidence, không được tự sửa dữ liệu của module khác. Backend cần API live matrix, summary, detail và snapshot. Frontend theo feature-based structure và có thể tham khảo UI Stitch, nhưng phải khớp app hiện tại.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em bắt tay vào code module RTM (Requirement Traceability Matrix). Đây là module tổng hợp dữ liệu từ nhiều thực thể của thành viên khác, nên phải tuân thủ nghiêm ngặt ranh giới chỉ đọc.
```

#### 5.3. Kết quả AI trả về

```text
Ý tưởng thiết kế RTM dưới dạng một tập hợp chỉ đọc (read-only aggregation) từ các bảng nghiệp vụ có sẵn trong DB. Thuật toán tính toán trạng thái gồm 4 mức độ: NOT_STARTED, IN_PROGRESS, AT_RISK, DONE và lưu cấu trúc snapshot dưới dạng JSONB.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em đã sử dụng logic tính toán trạng thái read-only, cấu trúc API `/api/v1/projects/{projectId}/rtm` cùng cách tổ chức thư mục frontend `features/rtm`.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em tiến hành rà soát lại các quan hệ khóa ngoại trước khi viết các câu query JPA. Vì RTM cần liên kết thông tin của Requirement, Task, Test Case, Bug và Evidence, em thắt chặt quyền hạn của service này để bảo đảm nó hoàn toàn không làm thay đổi hay tạo mới bất kỳ dữ liệu gốc nào từ các module của thành viên khác.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/0301fe8 |
| File liên quan | `RtmController.java`, `RtmServiceImpl.java`, `code/frontend/src/features/rtm`, `routes/index.jsx` |
| Screenshot | Chụp RTM page và prompt số 4 |
| Kết quả chạy/test | `./mvnw.cmd test` passed 34 tests; `npm run build` passed ngày 22/05/2026 |
| Link tài liệu/báo cáo | Tài liệu thiết kế module RTM |
| Ghi chú khác | Có thêm fix task route/status sau đó ở commit `ee0e288`, `ce74907` |

#### 5.8. Ghi chú thêm

```text
Giúp xây dựng module tổng hợp thông tin quan trọng của dự án.
```

---

### Prompt số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Codex |
| Mục đích | Triển khai Sprint Weekly Planning |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Dựa vào tài liệu bổ sung, hãy implement Sprint module nhưng chọn hướng Weekly + Sprint Planning View trước. Sprint chỉ quản lý sprint, assign task có sẵn vào sprint và plan ngày làm trong tuần. Không làm Daily View riêng và không làm AI Audit Tracker trong app v1.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em được giao làm module Sprint Planning để hỗ trợ quản lý công việc theo tuần, cần chọn lát cắt nghiệp vụ (slice) hợp lý cho bản v1 và không bị chồng chéo với Kanban Board.
```

#### 5.3. Kết quả AI trả về

```text
Boilerplate cho Sprint CRUD, cấu trúc bảng liên kết để gán task hiện có từ Kanban Board vào Sprint dựa trên trường `tasks.sprint_plan_date`, và sơ đồ luồng công suất thời gian (capacity_hours) của sprint.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em sử dụng cấu hình REST API trong SprintController/SprintServiceImpl, kịch bản Flyway migration thêm các trường lập kế hoạch sprint, và giao diện kéo thả weekly planner ở frontend.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em giới hạn nghiệp vụ: Sprint tuyệt đối không sở hữu vòng đời của Task (không tạo/xóa task). Mọi thao tác chi tiết về Task phải được giữ nguyên trên Task Board của thành viên khác nhằm tránh xung đột quyền ghi dữ liệu giữa hai module độc lập.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/fb46446 |
| File liên quan | `SprintController.java`, `SprintServiceImpl.java`, `V20260527110000__add_sprint_planning_fields.sql`, `code/frontend/src/features/sprint` |
| Screenshot | Chụp Sprint page/Weekly Planner và prompt số 5 |
| Kết quả chạy/test | Backend compile/test passed ngày 27/05/2026; frontend parser check passed |
| Link tài liệu/báo cáo | Hướng dẫn lập kế hoạch sprint tuần |
| Ghi chú khác | Commit `9d5a16f` fix `updatedAt` hiển thị UI |

#### 5.8. Ghi chú thêm

```text
Mốc kỹ thuật xây dựng khung quản lý thời gian Sprint.
```

---

### Prompt số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 29/05/2026 |
| Công cụ AI | Codex |
| Mục đích | Rà soát và củng cố các quy tắc nghiệp vụ cho Sprint Planning |
| Phần việc liên quan | Backend / Frontend / Debug |
| Mức độ sử dụng | Hỏi debug / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Review giúp tôi các rule Sprint hiện tại. Tôi muốn tránh overlap sprint, chỉ có một active sprint trong một project, không cho API lấy task từ sprint khác, và weekly planner phải sync lại khi đổi sprint hoặc đổi tuần. Nếu có conflict với develop thì ưu tiên giữ đúng behavior task/sprint hiện tại.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Sau khi implement Sprint MVP, em cần củng cố lại logic bảo mật và các ràng buộc nghiệp vụ ở backend (chống đè ngày hoạt động của sprint) trước khi merge vào nhánh develop chung.
```

#### 5.3. Kết quả AI trả về

```text
Các phương thức kiểm tra chồng chéo thời gian của các Sprint bằng SQL queries, cơ chế xác thực trạng thái duy nhất cho ACTIVE sprint trong một dự án, và logic reset state của component WeeklyPlanner trên frontend khi thay đổi tuần bắt đầu.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em đã áp dụng các câu truy vấn kiểm tra trùng lặp trong SprintRepository, các điều kiện logic validate ở Service layer và hàm cập nhật frontend.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em chủ động tách biệt hàm `findSprintsOverlappingWeek` (dùng để hiển thị danh sách sprint trong tuần lựa chọn trên UI) ra khỏi hàm `existsOverlappingSprint` (dùng để chặn cứng việc lưu một Sprint trùng ngày). Sự phân rã này giúp hệ thống không chặn nhầm các truy vấn xem dữ liệu vô hại.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/0793eb4 |
| File liên quan | `SprintRepository.java`, `SprintServiceImpl.java`, `WeeklyPlanner.jsx` |
| Screenshot | Chụp prompt số 6 và PR/merge evidence |
| Kết quả chạy/test | Backend compile có resources skipped passed; parser check frontend passed |
| Link tài liệu/báo cáo | Không có |
| Ghi chú khác | Có merge commit `566accf` |

#### 5.8. Ghi chú thêm

```text
Bảo đảm tính toàn vẹn của lịch trình dự án.
```

---

### Prompt số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex / ChatGPT |
| Mục đích | Thiết kế Use Case diagram và thảo luận ranh giới hệ thống (Module 5) |
| Phần việc liên quan | Design / UML Modeling |
| Mức độ sử dụng | Hỏi ý tưởng |

#### 5.1. Prompt nguyên văn

```text
Trong UML Use Case diagram, khi biểu diễn module Code Insight và Mentor Review, làm thế nào để phân định rõ ràng ranh giới hệ thống (system boundary) đối với các tác nhân bên ngoài như GitHub System và AI Engine? Hãy đề xuất cách phân định và thiết lập kịch bản giải trình logic ranh giới này.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Để chuẩn bị báo cáo tiến độ và bảo vệ UML Use Case trước giảng viên, em cần một mô hình ranh giới Actor/System chuẩn xác học thuật đối với các dịch vụ tự động bên ngoài.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất nguyên lý phân định: các hệ thống tự động không được xem là Actor nếu chúng là một phần nội bộ của ứng dụng. GitHub System và AI Engine phải là external actors nằm ngoài ranh giới (system boundary) vì chúng tương tác thông qua API/Webhook, còn các tính năng của Code Insight là Use Cases nội bộ.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em sử dụng nguyên lý xác định ranh giới tác nhân (boundary-actor) này để vẽ lại toàn bộ UML Use Case diagrams cho Module 5 và làm tài liệu giải trình milestone.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em vẽ sơ đồ bằng Mermaid diagram kết hợp phân nhóm màu trực quan để tăng tính trực quan. Đồng thời, em biên soạn lại kịch bản thuyết trình tiếng Việt bằng văn phong thuyết trình thực tế của bản thân thay vì đọc máy móc văn bản thô của AI.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Tài liệu nằm ngoài repo theo quy tắc lưu trữ tài liệu cá nhân |
| File liên quan | `D:/Semester_5/SWP391/Project/05_part5_usecase_diagrams.md`, `module5_presentation_script.md` |
| Screenshot | Chụp Mermaid diagram/script và prompt số 7 |
| Kết quả chạy/test | Không áp dụng vì là tài liệu |
| Link tài liệu/báo cáo | Tài liệu sơ đồ hệ thống Module 5 |
| Ghi chú khác | Sử dụng để vấn đáp và bảo vệ tiến độ |

#### 5.8. Ghi chú thêm

```text
Giải quyết tranh cãi về ranh giới Actor trong biểu đồ Use Case học thuật.
```

---

### Prompt số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex |
| Mục đích | Khôi phục vết (Backfill) Jira tasks dựa trên cấu trúc codebase và git history |
| Phần việc liên quan | Project tracking / Report |
| Mức độ sử dụng | Hỏi thiết kế / Hỏi phân tích |

#### 5.1. Prompt nguyên văn

```text
Nhóm em chưa maintain Jira từ đầu. Bạn hãy đọc git history, codebase hiện tại, các folder log/audit của từng thành viên và tài liệu planning để dựng lại task Jira hợp lý. Chỉ ghi task có evidence thật, có assignee, file/commit liên quan và acceptance criteria. Đừng tự bịa future task.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhóm cần đồng bộ hóa Jira backlog phục vụ kiểm toán tiến độ môn học, yêu cầu khớp nối chính xác giữa các đầu việc và commit lịch sử Git thật để chứng minh đóng góp của từng cá nhân.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất danh sách backlog Jira phân rã chi tiết từ lịch sử commits, gán đúng người thực hiện, acceptance criteria và liên kết mã SHA commit thực tế làm minh chứng kiểm tra.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em sử dụng danh sách phân rã này để cập nhật đồng bộ lại tiến độ của nhóm trên Jira, tạo liên kết chặt chẽ giữa Jira issue và Git commits thực tế.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em rà soát lại toàn bộ danh sách, chủ động loại bỏ tất cả các task thuộc diện kế hoạch tương lai chưa được code xong nhằm bảo đảm tính trung thực của dữ liệu minh chứng, giới hạn danh sách ở 32 issues thực tế đã Done.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Dựa trên git history toàn repo đến 30/05/2026 |
| File liên quan | `D:/Semester_5/SWP391/Project/project_tailieu/jira_backfill_task_breakdown.md` |
| Screenshot | Chụp prompt số 8 và file Jira breakdown |
| Kết quả chạy/test | Không áp dụng |
| Link tài liệu/báo cáo | Jira board tracking file |
| Ghi chú khác | Bảo đảm tính khớp nối 100% giữa Jira và lịch sử Git thật |

#### 5.8. Ghi chú thêm

```text
Hỗ trợ tái cấu trúc tài liệu quản lý dự án có kiểm chứng.
```

---

### Prompt số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex / ChatGPT |
| Mục đích | Thiết kế kiến trúc giải pháp Code Insight (Leader review gate & evidence integration) |
| Phần việc liên quan | Design / System Architecture |
| Mức độ sử dụng | Hỏi ý tưởng |

#### 5.1. Prompt nguyên văn

```text
Tôi muốn thiết kế kiến trúc cho module Code Insight sao cho quy trình phê duyệt của Leader không phụ thuộc hoàn toàn vào AI. Hãy phân tích cấu trúc kết hợp giữa: GitHub evidence thu thập không đồng bộ, bộ lọc rule-based scoring tại local, và tính năng lưu trữ audit snapshot khi có quyết định. Làm sao để mô hình này hoạt động khả thi và tối ưu về mặt nghiệp vụ?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em bắt tay vào lập kế hoạch kiến trúc cho module Code Insight, cần thiết kế một cơ chế kiểm chứng tiến độ đáng tin cậy kết hợp giữa automation (GitHub) và giám sát của con người (Leader) để nộp báo cáo.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất mô hình kiến trúc gồm 4 trụ cột chính: Leader Review Gate (cổng kiểm soát thủ công của leader), GitHub Webhook Evidence (thu thập commit/PR/CI checks không đồng bộ), Rule-Based Scoring (hệ thống tính điểm minh bạch theo quy tắc tại local), và Audit Snapshots (chụp ảnh lưu trữ toàn bộ bằng chứng tại thời điểm leader duyệt để đối chiếu về sau).
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em đã sử dụng kiến trúc phân tầng kết hợp này làm blueprint định hướng để chia nhỏ quá trình code module Code Insight thành các phase độc lập.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em quyết định thắt chặt tính bảo thủ của quy trình: AI chỉ đóng vai trò tư vấn tóm tắt (advisory), còn quyền quyết định và ký Approve/Request Changes bắt buộc là do con người (Leader) thực hiện thủ công, tránh tối đa việc để AI tự động thông qua (auto-approve) các Task.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Thiết kế kiến trúc, không code trực tiếp |
| File liên quan | `D:/Semester_5/SWP391/Project/Code_Insight_Module_Architecture_Report.md` |
| Screenshot | Chụp prompt số 9 và một phần kiến trúc thiết kế |
| Kết quả chạy/test | Không áp dụng ở bước thiết kế |
| Link tài liệu/báo cáo | Code Insight architecture report |
| Ghi chú khác | Report này trở thành blueprint cho phase Code Insight |

#### 5.8. Ghi chú thêm

```text
Blueprint định hướng kỹ thuật cho toàn bộ giai đoạn Code Insight.
```

---

### Prompt số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | Codex |
| Mục đích | Code Insight review gate MVP |
| Phần việc liên quan | Coding / Testing |
| Mức độ sử dụng | Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Bắt đầu Code Insight bằng slice nhỏ trước: task review gate MVP. Khi member chuyển task sang DONE, nếu project bật review gate thì task phải vào queue để leader approve/reject. Sau đó thêm project config cho Code Insight, gồm reviewGateEnabled và warning threshold. Đừng làm GitHub evidence hay AI vội.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em muốn Code Insight có workflow thật trước khi thêm GitHub và AI, để dễ test và dễ merge.
```

#### 5.3. Kết quả AI trả về

```text
AI thêm task review decisions, approve/reject API, config backend/frontend và review gate setting.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Code Insight có review queue MVP và config UI.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em chia commit nhỏ-vừa theo từng phần và chưa đụng GitHub evidence/AI ở phase này.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `4558e65`, `fbf504d`, `0345985`, `6a9fd4d`, `14b8c12` |
| File liên quan | `TaskServiceImpl.java`, `CodeInsightController.java`, `CodeInsightPage.jsx` |
| Screenshot | Review queue/config UI |
| Kết quả chạy/test | Compile/test theo module log |
| Link tài liệu/báo cáo | Code Insight architecture report |
| Ghi chú khác | Phase đầu của Code Insight |

#### 5.8. Ghi chú thêm

```text
Prompt này cố ý giới hạn "đừng làm GitHub evidence hay AI vội".
```

---

### Prompt số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 03/06/2026 |
| Công cụ AI | Codex |
| Mục đích | Resolve merge và dùng shared GitHub Integration |
| Phần việc liên quan | Coding / Debug / Review code |
| Mức độ sử dụng | Hỏi debug / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
Develop vừa có Issue Tracker GitHub config. Tôi không muốn Code Insight giữ một GitHub config riêng nữa. Hãy resolve merge theo hướng dùng chung github_integrations của Issue Tracker, xóa phần duplicate của Code Insight nếu cần, nhưng không được làm hỏng behavior Issue Tracker.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Code Insight đang có config GitHub riêng nhưng develop đã có GitHub Integration cho Issue Tracker, nếu giữ cả hai sẽ bị trùng.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất dùng `github_integrations` làm source of truth và cleanup phần duplicate của Code Insight.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Code Insight chuyển sang dùng shared GitHub Integration.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em giữ behavior Issue Tracker vì đó là module của thành viên khác, chỉ sửa phần Code Insight để tương thích lâu dài.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `786ec38` |
| File liên quan | `CodeInsightServiceImpl.java`, cleanup migration, `CodeInsightPage.jsx` |
| Screenshot | Prompt số 13/GitHub Config |
| Kết quả chạy/test | Regression tests ở các phase sau |
| Link tài liệu/báo cáo | Không có |
| Ghi chú khác | Có chạm module Issue Tracker/GitHub shared foundation |

#### 5.8. Ghi chú thêm

```text
Prompt này quan trọng vì nó tránh tạo hai GitHub config song song.
```

---

### Prompt số 12

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 04/06/2026 |
| Công cụ AI | Codex |
| Mục đích | Triển khai nạp bằng chứng GitHub, liên kết tự động và giao diện xem bằng chứng |
| Phần việc liên quan | Backend / Frontend / Testing |
| Mức độ sử dụng | Hỏi sinh code / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Tiếp tục Code Insight theo architecture report. Phase này cần lưu GitHub code evidence từ webhook push, pull_request, workflow_run, check_run; sau đó link evidence vào task bằng task key hoặc GitHub issue rõ ràng. Tiếp theo scoring phải dùng được commit/PR/CI evidence và UI leader có drawer xem evidence. Làm từng phần đơn giản, có test, không gọi AI ở phase này.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em tiếp tục triển khai các phase giữa của Code Insight liên quan đến việc thu thập dữ liệu webhook thật từ GitHub để phục vụ cho bộ quy tắc tính điểm (scoring) local.
```

#### 5.3. Kết quả AI trả về

```text
Thiết kế các bảng lưu trữ bằng chứng tự động (`github_commits`, `github_pull_requests`, `github_check_runs`), bộ phân phối webhook (`GitHubWebhookDispatcher`), logic liên kết task dựa trên quy tắc tên nhánh/khóa issue, và cấu trúc hiển thị Drawer chứa chi tiết bằng chứng.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em sử dụng cấu trúc các lớp nhận dữ liệu webhook, lưu trữ thực thể bằng chứng, logic liên kết Task và component UI hiển thị Drawer ở frontend.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em áp dụng chính sách liên kết (linking) an toàn và chặt chẽ: chỉ tự động liên kết khi Git branch name hoặc PR title chứa đúng định dạng khóa Task (ví dụ `TASK-12`, `TSK-12`, `task-12`). Em tuyệt đối bác bỏ phương án sử dụng AI semantic matching tự động liên kết vì rủi ro ghép sai bằng chứng vào task rất lớn.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `b933a0f`, `10e5007`, `c619e1a`, `3a6eda8` |
| File liên quan | `GitHubEvidenceServiceImpl.java`, `GitHubWebhookDispatcherImpl.java`, `CodeInsightEvidenceLinkServiceImpl.java`, `CodeInsightScoringServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Giao diện hàng đợi duyệt và Drawer hiển thị bằng chứng chi tiết |
| Kết quả chạy/test | Maven test suite passed (82, 88, 91, 93 tests qua từng phase); frontend build compile thành công |
| Link tài liệu/báo cáo | Tài liệu tích hợp GitHub webhook |
| Ghi chú khác | Giữ nguyên tương thích với các facade APIs cũ của Issue Tracker |

#### 5.8. Ghi chú thêm

```text
Mốc kỹ thuật kết nối dữ liệu thật từ GitHub làm bằng chứng.
```

---

### Prompt số 13

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 04/06/2026 - 07/06/2026 |
| Công cụ AI | Codex |
| Mục đích | Triển khai các phase 6-9 của Code Insight và thiết lập bộ quy tắc an toàn (CI risk gate) |
| Phần việc liên quan | Backend / Frontend / Testing / Debug |
| Mức độ sử dụng | Hỏi sinh code / Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Khi triển khai hoàn thiện quy trình phê duyệt Task Review (từ việc nạp changed files trên PR, lưu trữ snapshot khi leader ra quyết định phê duyệt/yêu cầu sửa đổi, hiển thị dashboard tổng hợp dữ liệu) và tích hợp cấu trúc AI review cục bộ; làm sao để xử lý trường hợp một Task có điểm số cao nhưng CI của PR đó lại thất bại (CI check run failed)? Hãy thiết kế cơ chế chặn cứng (hard gate) và hoàn thiện các APIs cho changed files caching, snapshots, và dashboard.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Ở giai đoạn hoàn thiện Code Insight để bàn giao MVP (Phase 6-9), em cần tích hợp báo cáo AI review cục bộ, nạp changed files PR, ghi snapshot quyết định, xây dựng dashboard tổng hợp, đồng thời giải quyết triệt để lỗi nghiệp vụ khi PR bị failed CI nhưng vẫn có điểm số cao vượt ngưỡng READY.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất triển khai:
1. Phase 6 (PR Changed Files): API nạp danh sách file thay đổi của PR và lưu cache local summary.
2. Phase 7 (AI Review Local): Triển khai DTO và service tạo báo cáo đánh giá AI cục bộ.
3. Phase 8 (Audit Snapshots): Chụp lại toàn bộ trạng thái code/evidence hiện tại khi leader Approve/Request Changes.
4. Phase 9 (Dashboard): Tổng hợp biểu đồ thống kê review lỗi, thiếu bằng chứng.
5. CI Risk Gate: Điều chỉnh logic tính điểm để chèn một chốt chặn cứng: nếu có bất kỳ check run nào của PR bị FAILED, đặt trạng thái riskLevel thành `BLOCKED` ngay lập tức, bất chấp điểm số tổng của Task vẫn cao hơn ngưỡng cảnh báo (>75).
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em đã áp dụng API lưu snapshots, cache changed files PR, cấu trúc báo cáo AI cục bộ, dashboard metrics và logic chặn cứng CI Failed.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Trong quá trình kiểm thử thủ công (manual test), em phát hiện ban đầu mã nguồn tính điểm vẫn cho phép một Task có PR bị FAILED CI hiển thị trạng thái READY (do điểm trừ -25 chưa đủ kéo score xuống dưới ngưỡng cảnh báo). Em đã yêu cầu AI viết lại logic để đưa tín hiệu FAILED CI thành rule ưu tiên tuyệt đối, ghi đè trực tiếp trạng thái thành `BLOCKED` không cho Approve để đảm bảo tính an toàn tích hợp.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `f92a255`, `87eee37`, `41bfb06`, `db2c023`, `a39808f`, `d7b59b0` |
| File liên quan | `CodeInsightPatchServiceImpl.java`, `CodeInsightAiReviewServiceImpl.java`, `CodeInsightReviewSnapshotServiceImpl.java`, `CodeInsightServiceImpl.java`, `CodeInsightScoringServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Chụp dashboard/evidence drawer/failed CI case và prompt số 13 |
| Kết quả chạy/test | `./mvnw.cmd test` passed 93 tests ngày 04/06/2026; `.\mvnw.cmd "-Dtest=CodeInsightScoringServiceImplTest" test` passed ngày 05/06/2026; commit fix CI head ngày 07/06/2026 |
| Link tài liệu/báo cáo | Code Insight architecture report |
| Ghi chú khác | Mốc kết thúc giai đoạn Code Insight MVP |

#### 5.8. Ghi chú thêm

```text
Chốt chặn an toàn quan trọng chống lọt lỗi build/test lên production.
```

---

### Prompt số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 14/06/2026 |
| Công cụ AI | Gemini / Codex |
| Mục đích | Thảo luận thiết kế mô hình đánh giá thay thế Task Review và RTM integration |
| Phần việc liên quan | Architecture / System Design |
| Mức độ sử dụng | Hỏi định hướng / Hỏi giải pháp |

#### 5.1. Prompt nguyên văn

```text
Có hướng nào khác ngoài hướng đi tính điểm như thế này không?
Nếu đi theo mô hình gate result evidence confidence và code risk thì có thể áp dụng được cho mọi task type luôn hay sao?
Vậy với hướng đi này thì có điểm nào tôi có thể khai thác sâu về mặt kỹ thuật không, ví dụ như áp dụng kiến trúc hệ thống để xử lí một thứ gì đó, hoặc dùng ai để phân tích một vấn đề nào đó. Tôi muốn có một điểm nào đó để tôi đi sâu về mặt kỹ thuật hơn?
Có cách nào để đi xuống máy local và đọc code của người khác được không?
Tôi muốn bạn phân tích thêm 1 vấn đề nữa là nếu như review task ở đây thì rtm sẽ giải quyết được vấn đề gì?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em thấy mô hình tính điểm Code Insight 0-100 cũ quá cơ học và dễ gây tranh cãi. Em muốn thảo luận định hình lại kiến trúc và cách RTM liên kết với kết quả phê duyệt.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất mô hình 3 trụ cột (Gate Result, Evidence Confidence, Code Risk), phân chia Policy theo Task Type để áp dụng chung, gợi ý kiến trúc Event-Driven Webhook Pipeline + CQRS Review Projection làm điểm nhấn kỹ thuật sâu, và thiết kế luồng tích hợp RTM làm bằng chứng xác thực.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Quyết định tái cấu trúc toàn diện module Code Insight dựa trên mô hình đánh giá mới này và thiết lập kiến trúc Event-Driven kết hợp Read/Write database model.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em quyết định hủy bỏ thiết kế Local Agent vì lý do an toàn bảo mật, thay thế hoàn toàn bằng remote PR/commit webhook.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [ ] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Phân tích định hướng thiết kế |
| File liên quan | `Nguyen_Minh_Hieu/AI_PROJECT_CONTEXT_LOG.md` |
| Screenshot | Sơ đồ kiến trúc Event-Driven và CQRS trong report |
| Kết quả chạy/test | Không áp dụng |
| Link tài liệu/báo cáo | Tài liệu thiết kế module Task Review |
| Ghi chú khác | Không |

#### 5.8. Ghi chú thêm

```text
Định hình lại toàn bộ mô hình đánh giá từ số học sang lô-gíc kiểm chứng.
```

---

### Prompt số 15

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/06/2026 - 17/06/2026 |
| Công cụ AI | Gemini / Codex |
| Mục đích | Sửa WebSocket, tối ưu gộp Gemini, refactor namespace, SSE và manual evidence |
| Phần việc liên quan | Coding / Debug / Refactor |
| Mức độ sử dụng | Hỏi sinh code / Hỏi debug / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
No static resource api/ws/notifications for request '/api/ws/notifications' - sửa lỗi WebSocket path mismatch này và wire up Approve & Request Changes buttons trong workspace.
có cách nào để gửi 1 lần mà vẫn bao quát được cho 3 req-alignment không?
Yêu cầu refactor toàn bộ tên lớp và đường dẫn API từ Code Insight sang Task Review namespace để tăng tính rõ ràng cho module, đồng thời tích hợp thêm SSE streaming AI review, hiển thị chi tiết review, và liên kết minh chứng thủ công (manual evidence links) để xử lý các task không có PR/commit tự động.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Khi gộp code bị lỗi WebSocket. APIs cũ bị trùng lặp khái niệm Code Insight nên em quyết định đổi tên toàn bộ namespace sang Task Review, đồng thời tối ưu hóa 429 quota Gemini.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất WebSocketHandlerConfig, cấu trúc prompt gộp streaming Gemini cho model `gemini-3.1-flash-lite`, kế hoạch đổi tên class/folder/route, và cấu trúc DB/REST APIs cho manual links cùng SSE review controller.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Sửa lỗi WebSocket notifications, tích hợp SSE streaming và giao diện liên kết bằng chứng thủ công trong workspace mới.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em giữ lại class `CodeInsightController` cũ cho các module khác tương thích ngược tạm thời. Em tự bổ sung logic close EventSource tại frontend để tránh rò rỉ kết nối.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `f3e589a`, `77dbe9a`, `02c89f5` |
| File liên quan | `WebSocketHandlerConfig.java`, `TaskReviewController.java`, `ManualEvidenceLinkServiceImpl.java`, `TaskReviewWorkspacePage.jsx` |
| Screenshot | Modal liên kết thủ công và logs stream AI review |
| Kết quả chạy/test | Maven test suite (125 tests passed), Vite build successful |
| Link tài liệu/báo cáo | Tài liệu code Task Review |
| Ghi chú khác | Không |

#### 5.8. Ghi chú thêm

```text
Gộp cuộc gọi Gemini giúp tốc độ phản hồi AI tăng rõ rệt và không còn lỗi Rate Limit 429.
```

---

### Prompt số 16

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/06/2026 - 30/06/2026 |
| Công cụ AI | Gemini / Codex / Antigravity |
| Mục đích | Nâng cấp sơ đồ kiến trúc (AWS layout, MongoDB override, Draw.io exporter, Vision check) |
| Phần việc liên quan | Frontend / Backend / Layout Engine |
| Mức độ sử dụng | Hỏi giải pháp / Hỏi sinh code / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

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

#### 5.2. Bối cảnh khi viết prompt

```text
Sơ đồ kiến trúc tự động bằng ELK có lúc bị lệch tọa độ tương đối, đường nối bị mồ côi, và người dùng không lưu lại được vị trí kéo thả hoặc xuất sơ đồ ra Draw.io để nộp báo cáo.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất dùng MongoDB để lưu overrides, thuật toán cộng offset tuyệt đối và Drift Detection (ngưỡng 6px) để fallback SmoothStep. AI cung cấp code drawioExporter đóng gói nén XML, code xuất PNG/SVG, và diagram_vision_check.py gọi Gemini Vision.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Sơ đồ AWS đẹp mắt, hỗ trợ lưu vị trí khi kéo thả vào MongoDB, hỗ trợ xuất Draw.io và có Vision AI tự gợi ý co giãn khoảng cách.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em tự lập trình lại thuật toán `fitToNodes` tính toán bounding box thủ công từ tọa độ ELK do fitView của React Flow v12 bị bất đồng bộ với ResizeObserver. Em chỉnh ngưỡng Drift là 6px để đường nối không bị giật cục.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [x] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `[DE200322] feat: upgrade system architecture diagram with AWS conventions...` |
| File liên quan | `useGraphLayout.js`, `ElkEdge.jsx`, `ArchitectureGraph.java`, `drawioExporter.js`, `diagram_vision_check.py` |
| Screenshot | Sơ đồ AWS full canvas, modal xuất XML và Legend panel |
| Kết quả chạy/test | Kéo thả lưu MongoDB thành công, mở file Draw.io trên diagrams.net thành công |
| Link tài liệu/báo cáo | Báo cáo kiến trúc hệ thống |
| Ghi chú khác | Khắc phục lỗi measured của React Flow v12 |

#### 5.8. Ghi chú thêm

```text
Hàm fitBounds tự viết giúp nút Fit View hoạt động ổn định 100%.
```

---

### Prompt số 17

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/07/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Triển khai module Admin Project Management và sửa lỗi Null Parameter JPQL |
| Phần việc liên quan | Backend / Frontend / Database |
| Mức độ sử dụng | Hỏi sinh code / Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Triển khai module Quản lý dự án cho Admin: bao gồm thống kê, tìm kiếm, phân trang, đình chỉ (khóa mềm có lý do), kích hoạt lại, và xóa mềm (soft delete). Sửa lỗi "ERROR: could not determine data type of parameter $4" liên quan đến việc truyền tham số Null trong truy vấn JPQL trên PostgreSQL.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em bắt tay làm module Quản lý dự án cho Admin để hoàn thiện phân quyền, nhưng JPQL dynamic nullable parameter gặp lỗi kiểu dữ liệu nghiêm trọng trên PostgreSQL.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất phân rã dynamic JPQL thành 6 query tĩnh riêng biệt trong repository để PostgreSQL không phải suy luận kiểu tham số Null, đồng thời cung cấp REST APIs, service và React page quản lý dự án.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Admin Project Management module hoàn tất, hoạt động bình thường trên PostgreSQL không còn lỗi parameter type mismatch.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em thắt chặt nghiệp vụ: Admin chỉ có quyền Khóa/Đình chỉ và Xóa mềm dự án chứ không được sửa trạng thái của dự án. Em đồng thời chèn filter `isDeleted = false` vào toàn bộ API truy vấn của user thông thường.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | `[DE200322] feat: implement Admin Project Management module` |
| File liên quan | `ProjectRepository.java`, `SystemAdminProjectController.java`, `ProjectManagementPage.jsx`, `adminService.js` |
| Screenshot | UI Admin Project Management, statistics panel, suspension modal |
| Kết quả chạy/test | Backend test passed, smoke check API stats trả về 403 Forbidden khi thiếu auth |
| Link tài liệu/báo cáo | Báo cáo module quản lý hệ thống |
| Ghi chú khác | Không |

#### 5.8. Ghi chú thêm

```text
Tách query tĩnh là cách xử lý sạch và tối ưu phân trang nhất cho JPA khi kết hợp PostgreSQL.
```

---

## 6. Prompt quan trọng nhất

Chọn một prompt có ảnh hưởng lớn nhất đến bài tập/project.

### 6.1. Prompt được chọn

```text
Hãy đọc lại report Code Insight hiện tại và viết lại cho dễ hiểu hơn. Tôi muốn kiến trúc không phụ thuộc hoàn toàn vào AI, có GitHub evidence, rule-based scoring, leader approval gate, audit snapshot, secret redaction, webhook async và ví dụ cụ thể để thầy cô dễ hiểu.
```

### 6.2. Vì sao prompt này quan trọng?

```text
Prompt này định hình lại toàn bộ Code Insight. Nếu không có hướng này, module dễ bị hiểu thành "AI tự chấm code", trong khi hướng đúng hơn là evidence + rule score + AI hỗ trợ + leader quyết định.
```

### 6.3. Kết quả prompt này mang lại

```text
Nó tạo blueprint cho các phase: review gate, GitHub evidence, evidence linking, scoring, evidence drawer, changed files, AI summary, audit snapshot và dashboard.
```

### 6.4. Sinh viên/nhóm đã kiểm tra kết quả như thế nào?

```text
Em kiểm tra bằng cách implement theo từng phase nhỏ, chạy backend compile/test, frontend build và manual test failed CI/risk.
```

### 6.5. Sinh viên/nhóm đã cải tiến gì từ kết quả AI?

```text
Em không làm AI auto-approve, không link evidence bằng AI semantic matching và giữ failed CI là hard BLOCKED risk.
```

---

## 7. Prompt chưa hiệu quả

Ghi lại ít nhất một prompt chưa tạo ra kết quả tốt hoặc chưa phù hợp.

### 7.1. Prompt chưa hiệu quả

```text
Làm giúp tôi Code Insight đầy đủ luôn, có GitHub, AI review, scoring, dashboard và tự đánh giá task.
```

### 7.2. Vì sao prompt này chưa hiệu quả?

```text
Prompt này quá rộng, dễ khiến AI sinh một thiết kế lớn nhưng khó kiểm tra. Nó cũng dễ làm AI hiểu nhầm là AI được tự đánh giá hoặc tự approve task, không phù hợp với project học thuật và requirement minh bạch.
```

### 7.3. Cách cải thiện prompt

```text
Chia Code Insight thành từng phase nhỏ, nói rõ phần nào được làm, phần nào chưa làm, có test nào cần chạy và không được thay đổi module khác nếu chưa cần.
```

### 7.4. Prompt sau khi cải tiến

```text
Bắt đầu Code Insight bằng slice nhỏ trước: task review gate MVP. Khi member chuyển task sang DONE, nếu project bật review gate thì task phải vào queue để leader approve/reject. Sau đó thêm project config cho Code Insight, gồm reviewGateEnabled và warning threshold. Đừng làm GitHub evidence hay AI vội.
```

### 7.5. Kết quả sau khi cải tiến prompt

```text
AI trả về đúng phạm vi hơn. Review gate MVP được implement trước, sau đó mới tiếp tục GitHub evidence và AI summary ở các phase sau.
```

---

## 8. Bài học về cách viết prompt

### 8.1. Khi viết prompt, em/nhóm cần cung cấp thông tin gì để AI trả lời tốt hơn?

```text
Cần đưa rõ mục tiêu, module đang làm, công nghệ đang dùng, file hoặc schema liên quan, rule nghiệp vụ, phạm vi không được làm và kết quả cần kiểm chứng. Nếu prompt code thì phải nói rõ test/build nào cần chạy.
```

Gợi ý:

- Mục tiêu cần đạt.
- Bối cảnh bài toán.
- Công nghệ/ngôn ngữ lập trình đang dùng.
- Input/output mong muốn.
- Ràng buộc của đề bài.
- Lỗi đang gặp.
- Format kết quả mong muốn.
- Yêu cầu AI giải thích từng bước.

### 8.2. Em/nhóm đã học được gì về cách đặt câu hỏi cho AI?

```text
Em học được là hỏi càng cụ thể thì AI càng ít đi sai hướng. Với code, phải nói rõ không được đụng module nào, không được sửa migration cũ, và phải làm theo từng phase nhỏ.
```

### 8.3. Lần sau em/nhóm sẽ cải thiện prompt như thế nào?

```text
Em sẽ ghi kèm context file/commit/test ngay từ đầu, yêu cầu AI giải thích rủi ro trước khi code, và bắt AI nêu phần nào chắc chắn, phần nào cần tự kiểm tra.
```

---

## 9. Phân loại prompt đã sử dụng

Đánh dấu số lượng prompt theo từng nhóm.

| Loại prompt | Số lượng | Ví dụ prompt tiêu biểu |
|---|---:|---|
| Prompt phân tích yêu cầu | 4 | Prompt số 1, 2, 7, 14 |
| Prompt giải thích kiến thức | 1 | Prompt số 3 |
| Prompt thiết kế giải pháp | 5 | Prompt số 3, 4, 9, 14, 16 |
| Prompt thiết kế database | 4 | Prompt số 2, 3, 14, 17 |
| Prompt sinh code mẫu | 8 | Prompt số 4, 5, 10, 12, 13, 15, 16, 17 |
| Prompt debug lỗi | 5 | Prompt số 6, 11, 13, 15, 17 |
| Prompt viết test case | 6 | Prompt số 4, 10, 12, 13, 15, 17 |
| Prompt review code | 7 | Prompt số 6, 9, 11, 12, 13, 15, 16 |
| Prompt tối ưu code | 4 | Prompt số 11, 12, 15, 16 |
| Prompt viết báo cáo | 2 | Prompt số 7, 9 |
| Prompt chuẩn bị thuyết trình | 1 | Prompt số 7 |
| Prompt khác | 1 | Prompt số 8 |

---

## 10. Checklist chất lượng prompt

Sinh viên/nhóm tự kiểm tra chất lượng prompt đã dùng.

| Tiêu chí | Đã đạt? | Ghi chú |
|---|:---:|---|
| Prompt có mục tiêu rõ ràng | x | Hầu hết prompt đều nêu module và kết quả cần đạt |
| Prompt có đủ bối cảnh | x | Có nêu codebase, workflow, phase hoặc lỗi đang gặp |
| Prompt có nêu công nghệ/ngôn ngữ sử dụng | x | Spring Boot, PostgreSQL, Flyway, React/Vite, GitHub webhook |
| Prompt có nêu yêu cầu đầu ra | x | API, UI, test, report, Jira breakdown |
| Prompt không yêu cầu AI làm toàn bộ bài một cách máy móc | x | Các prompt được chia theo phase |
| Prompt có yêu cầu AI giải thích hoặc phân tích | x | Nhiều prompt yêu cầu review/risk/actor-boundary |
| Kết quả AI được kiểm tra lại | x | Chạy test/build/manual check |
| Kết quả AI được chỉnh sửa trước khi sử dụng | x | Chỉnh scope, rule, UI copy, merge direction |
| Prompt quan trọng được ghi lại đầy đủ | x | 17 prompt chính đã ghi |
| Prompt sai/chưa hiệu quả được rút kinh nghiệm | x | Có ví dụ prompt quá rộng và prompt cải tiến |

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
| Nguyễn Minh Hiếu | 01/07/2026 |
