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
| Ngày cập nhật gần nhất | 08/06/2026 |

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
| 3 | 17/05/2026 | ChatGPT/Codex | Backend foundation | Setup Spring Boot/PostgreSQL/Flyway theo convention | Kiến trúc controller-service-repository, migration rule | Có | commit `a9ba9d2` |
| 4 | 21/05/2026 | Codex | AI handoff log | Tạo bộ nhớ local cho các chat AI | 3 file context/technique/handoff | Có | `Nguyen_Minh_Hieu/*.md` |
| 5 | 22/05/2026 | Codex/Stitch | RTM implementation | Implement RTM read-only live matrix/snapshot | Backend API + frontend RTM page | Có | commit `0301fe8` |
| 6 | 27/05/2026 | Codex | Sprint Weekly Planning | Implement sprint planning theo weekly view | Sprint CRUD, assign task, weekly planner | Có | commit `fb46446` |
| 7 | 29/05/2026 | Codex | Sprint debug/rule | Harden overlap/active sprint/reassign task | Rule service và UI sync ổn hơn | Có | commit `0793eb4` |
| 8 | 27/05/2026 | Codex/ChatGPT | Use case diagram/script | Review actor-boundary và viết script milestone | Diagram/script Module 5 | Có | file report ngoài repo |
| 9 | 30/05/2026 | Codex | Jira backfill | Dựng Jira task từ git/codebase/evidence | 32 issue Done có evidence | Có | `jira_backfill_task_breakdown.md` |
| 10 | 30/05/2026 | Codex | Debug seed/cache | Project seed không hiện UI và HashGeneratorRunner | Redis cache + cleanup helper | Có | commit `8ba65de` |
| 11 | 30/05/2026 | Codex/ChatGPT | Code Insight architecture | Viết lại report kiến trúc Code Insight | GitHub evidence + scoring + leader gate | Có | architecture report |
| 12 | 01/06/2026 | Codex | Review gate/config | Implement Code Insight review gate MVP | Task review decision + config UI | Có | commits `4558e65`, `fbf504d` |
| 13 | 03/06/2026 | Codex | GitHub integration merge | Dùng shared GitHub Integration, bỏ duplicate | Code Insight dùng `github_integrations` | Có | commit `786ec38` |
| 14 | 04/06/2026 | Codex | Evidence/scoring/drawer | Ingest GitHub evidence, link task, scoring V2 | Commit/PR/CI evidence + evidence drawer | Có | commits `b933a0f`..`3a6eda8` |
| 15 | 04-07/06/2026 | Codex | Code Insight phase 6-9/fix | Patch files, AI summary, snapshot, dashboard, CI risk | Hoàn thiện review flow và fix failed CI BLOCKED | Có | commits `f92a255`..`d7b59b0` |

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
Backend mới được khởi tạo, em cần chắc là cấu trúc ban đầu đủ ổn để nhóm phát triển tiếp.
```

#### 5.3. Kết quả AI trả về

```text
AI gợi ý layered architecture, dùng Flyway migration, không sửa migration cũ, dùng DTO cho API và đưa rule vào service layer.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Backend giữ cấu trúc controller-service-repository-entity-dto và migration riêng.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em tự kiểm tra dependency, config PostgreSQL và giữ convention này trong các module sau.
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
| Link commit | `a9ba9d2` |
| File liên quan | `code/backend/pom.xml`, `code/backend/src/main/resources/db/migration` |
| Screenshot | Prompt số 3 |
| Kết quả chạy/test | Các test module sau chạy trên foundation này |
| Link tài liệu/báo cáo | Không có |
| Ghi chú khác | Nền kỹ thuật |

#### 5.8. Ghi chú thêm

```text
Đây là prompt hỗ trợ setup, không phải AI viết toàn bộ backend.
```

---

### Prompt số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 21/05/2026 |
| Công cụ AI | Codex |
| Mục đích | Tạo local handoff log |
| Phần việc liên quan | Report / Other |
| Mức độ sử dụng | Hỏi sinh code / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
Bạn đọc project hiện tại, rồi tạo giúp tôi vài file local để ghi lại context quan trọng qua từng lần làm việc với AI. Tôi không muốn lưu mọi prompt, chỉ muốn log các quyết định lớn, module nào đã làm, kỹ thuật gì đã dùng, và hướng handoff cho agent khác sau này.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em dùng nhiều chat AI khác nhau nên sợ mất context. Cần một bộ nhớ local để sau này tổng hợp AI audit.
```

#### 5.3. Kết quả AI trả về

```text
AI tạo/đề xuất AI_PROJECT_CONTEXT_LOG.md, MODULE_IMPLEMENTATION_TECHNIQUE_LOG.md và AGENT_HANDOFF_GUIDE.md.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Các file này được dùng làm nguồn tổng hợp lại 4 file nộp hiện tại.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em yêu cầu để file local/ignored và chỉ chọn lọc phần phù hợp khi nộp.
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
| Link commit | Không commit vì file local |
| File liên quan | `Nguyen_Minh_Hieu/AI_PROJECT_CONTEXT_LOG.md`, `MODULE_IMPLEMENTATION_TECHNIQUE_LOG.md`, `AGENT_HANDOFF_GUIDE.md` |
| Screenshot | Prompt số 4 |
| Kết quả chạy/test | Không áp dụng |
| Link tài liệu/báo cáo | Không có |
| Ghi chú khác | Hỗ trợ minh bạch AI usage |

#### 5.8. Ghi chú thêm

```text
Prompt này giúp quá trình ghi log không bị đứt đoạn.
```

---

### Prompt số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 22/05/2026 |
| Công cụ AI | Codex / Stitch |
| Mục đích | Implement RTM |
| Phần việc liên quan | Coding / Testing / Design |
| Mức độ sử dụng | Hỏi sinh code / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Tôi muốn implement module RTM theo plan đã thống nhất. RTM chỉ đọc dữ liệu từ requirement, task, test case, bug và evidence, không được tự sửa dữ liệu của module khác. Backend cần API live matrix, summary, detail và snapshot. Frontend theo feature-based structure và có thể tham khảo UI Stitch, nhưng phải khớp app hiện tại.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em phụ trách RTM, đây là module cần đọc nhiều dữ liệu từ module khác nên phải làm cẩn thận.
```

#### 5.3. Kết quả AI trả về

```text
AI triển khai RTM API, status derivation, snapshot JSONB và frontend RTM page.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
RTM live matrix và snapshot được đưa vào codebase.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em giữ RTM read-only để không chạm quyền tạo/sửa của Requirement, Task, Test Case, Bug và Evidence.
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
| Link commit | `0301fe8` |
| File liên quan | `RtmController.java`, `RtmServiceImpl.java`, `code/frontend/src/features/rtm` |
| Screenshot | RTM page/prompt số 5 |
| Kết quả chạy/test | Backend test 34 tests passed; frontend build passed |
| Link tài liệu/báo cáo | RTM module docs nếu có |
| Ghi chú khác | Có fix task route/status sau đó |

#### 5.8. Ghi chú thêm

```text
Đây là prompt implementation quan trọng nhất ở giai đoạn đầu.
```

---

### Prompt số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Codex |
| Mục đích | Implement Sprint Weekly Planning |
| Phần việc liên quan | Coding / Testing |
| Mức độ sử dụng | Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Dựa vào tài liệu bổ sung, hãy implement Sprint module nhưng chọn hướng Weekly + Sprint Planning View trước. Sprint chỉ quản lý sprint, assign task có sẵn vào sprint và plan ngày làm trong tuần. Không làm Daily View riêng và không làm AI Audit Tracker trong app v1.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhóm cần sprint management nhưng không muốn trùng với task board. Em chọn weekly planning để leader phân bổ task theo ngày.
```

#### 5.3. Kết quả AI trả về

```text
AI thêm Sprint CRUD, status update, task assignment, sprint plan date và weekly planner UI.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Module Sprint Weekly Planning được implement ở backend và frontend.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em giữ Task Board là nơi tạo/sửa task, Sprint chỉ plan task đã có.
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
| Link commit | `fb46446`, `9d5a16f` |
| File liên quan | `SprintController.java`, `SprintServiceImpl.java`, `features/sprint` |
| Screenshot | Sprint Weekly Planner/prompt số 6 |
| Kết quả chạy/test | Backend compile/test passed; parser check passed |
| Link tài liệu/báo cáo | `project_tailieu/bosung.md` |
| Ghi chú khác | Vite build bị `spawn EPERM` trong sandbox |

#### 5.8. Ghi chú thêm

```text
Prompt này đã giới hạn scope rõ nên không bị lan sang Daily View.
```

---

### Prompt số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 29/05/2026 |
| Công cụ AI | Codex |
| Mục đích | Debug và harden Sprint |
| Phần việc liên quan | Debug / Coding |
| Mức độ sử dụng | Hỏi debug / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Review giúp tôi các rule Sprint hiện tại. Tôi muốn tránh overlap sprint, chỉ có một active sprint trong một project, không cho API lấy task từ sprint khác, và weekly planner phải sync lại khi đổi sprint hoặc đổi tuần. Nếu có conflict với develop thì ưu tiên giữ đúng behavior task/sprint hiện tại.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Sau khi Sprint chạy được, em cần kiểm tra rule nghiệp vụ để chuẩn bị merge.
```

#### 5.3. Kết quả AI trả về

```text
AI gợi ý validate overlap, active sprint, reassign task và sync frontend state.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Sprint business rule được harden ở service/repository và WeeklyPlanner.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em phân biệt query dùng để hiển thị sprint trong tuần với query dùng để chặn overlap sprint.
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
| Link commit | `0793eb4`, `566accf`, `b4d881f` |
| File liên quan | `SprintRepository.java`, `SprintServiceImpl.java`, `WeeklyPlanner.jsx` |
| Screenshot | Prompt số 7 |
| Kết quả chạy/test | Compile/parser check |
| Link tài liệu/báo cáo | Không có |
| Ghi chú khác | Có hỗ trợ merge develop |

#### 5.8. Ghi chú thêm

```text
Prompt này thiên về review rule hơn là sinh mới feature.
```

---

### Prompt số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Codex / ChatGPT |
| Mục đích | Use case diagram và script milestone |
| Phần việc liên quan | Report / Presentation |
| Mức độ sử dụng | Hỏi review / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Tôi cần làm phần use case diagram cho Module 5 gồm RTM, Code Insight và Mentor Review. Hãy review giúp actor nào nên để ngoài system boundary, actor nào không nên để. Sau đó viết giúp tôi script tiếng Việt ngắn để thuyết trình khoảng 4 slide.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em chuẩn bị phần milestone và cần giải thích đúng về actor trong use case diagram.
```

#### 5.3. Kết quả AI trả về

```text
AI chỉ ra GitHub System và AI Engine có thể là external actor, còn Code Insight là module nội bộ.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Use case diagrams và script tiếng Việt được chỉnh cho phần presentation.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em chọn lại layout diagram có màu/group cho dễ trình bày và sửa script theo cách nói của mình.
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
| Link commit | Không áp dụng, tài liệu ngoài repo |
| File liên quan | `05_part5_usecase_diagrams.md`, `module5_presentation_script.md` |
| Screenshot | Diagram/script/prompt số 8 |
| Kết quả chạy/test | Không áp dụng |
| Link tài liệu/báo cáo | `D:/Semester_5/SWP391/Project` |
| Ghi chú khác | Report material |

#### 5.8. Ghi chú thêm

```text
AI hỗ trợ tốt phần reasoning UML, nhưng bản cuối phải trình bày được bằng lời của mình.
```

---

### Prompt số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex |
| Mục đích | Jira backfill |
| Phần việc liên quan | Report / Other |
| Mức độ sử dụng | Hỏi review / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Nhóm em chưa maintain Jira từ đầu. Bạn hãy đọc git history, codebase hiện tại, các folder log/audit của từng thành viên và tài liệu planning để dựng lại task Jira hợp lý. Chỉ ghi task có evidence thật, có assignee, file/commit liên quan và acceptance criteria. Đừng tự bịa future task.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhóm cần tracking lại công việc đã làm nhưng không muốn ghi theo trí nhớ hoặc ghi task chưa làm.
```

#### 5.3. Kết quả AI trả về

```text
AI tạo Jira breakdown theo epics/issues, sau đó được gộp còn 32 issue Done có evidence.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
File Jira backfill được dùng để cập nhật tracking nhóm.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em yêu cầu bỏ Planned task và chỉ giữ việc có bằng chứng thật.
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
| Link commit | Git history đến 30/05/2026 |
| File liên quan | `jira_backfill_task_breakdown.md` |
| Screenshot | Prompt số 9/Jira table |
| Kết quả chạy/test | Không áp dụng |
| Link tài liệu/báo cáo | `D:/Semester_5/SWP391/Project/project_tailieu` |
| Ghi chú khác | Chỉ dùng evidence-backed tasks |

#### 5.8. Ghi chú thêm

```text
Prompt này có nhiều lần follow-up để gộp task và bỏ future plan.
```

---

### Prompt số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex |
| Mục đích | Debug seed/cache và HashGeneratorRunner |
| Phần việc liên quan | Debug / Database |
| Mức độ sử dụng | Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Tôi seed data trực tiếp bằng pgAdmin, bảng projects và project_members có dữ liệu rồi nhưng UI My Projects vẫn không thấy project. Bạn kiểm tra giúp khả năng do backend cache hay lỗi membership. Ngoài ra file HashGeneratorRunner đang làm gì, có ảnh hưởng khi chạy app không?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em cần data mẫu để test nhưng UI không hiện project dù database có data.
```

#### 5.3. Kết quả AI trả về

```text
AI chỉ ra Redis cache có thể giữ project list cũ và HashGeneratorRunner là helper tạo BCrypt hash đang bị chạy cùng app.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Em debug cache và cleanup HashGeneratorRunner.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em xác minh data bằng pgAdmin trước, không kết luận chỉ dựa vào AI.
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
| Link commit | `8ba65de`, `1f8f308` |
| File liên quan | `ProjectServiceImpl.java`, `HashGeneratorRunner.java` |
| Screenshot | Prompt số 10/pgAdmin/Redis |
| Kết quả chạy/test | Manual DB/cache check |
| Link tài liệu/báo cáo | Không có |
| Ghi chú khác | Direct SQL insert không tự clear cache |

#### 5.8. Ghi chú thêm

```text
Prompt này giúp phân biệt lỗi data thật với lỗi cache.
```

---

### Prompt số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 30/05/2026 |
| Công cụ AI | Codex / ChatGPT |
| Mục đích | Code Insight architecture report |
| Phần việc liên quan | Design / Report |
| Mức độ sử dụng | Hỏi sinh code / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Hãy đọc lại report Code Insight hiện tại và viết lại cho dễ hiểu hơn. Tôi muốn kiến trúc không phụ thuộc hoàn toàn vào AI, có GitHub evidence, rule-based scoring, leader approval gate, audit snapshot, secret redaction, webhook async và ví dụ cụ thể để thầy cô dễ hiểu.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Em chuẩn bị thiết kế Code Insight nhưng không muốn trình bày kiểu "AI chấm code" chung chung.
```

#### 5.3. Kết quả AI trả về

```text
AI viết lại report thành kiến trúc GitHub evidence + deterministic scoring + bounded AI review + leader final authority.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Report này trở thành blueprint cho các phase Code Insight sau đó.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em quyết định AI không auto-approve và chỉ hỗ trợ tóm tắt/đánh giá.
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
| Link commit | Không áp dụng, tài liệu ngoài repo |
| File liên quan | `Code_Insight_Module_Architecture_Report.md` |
| Screenshot | Prompt số 11/report |
| Kết quả chạy/test | Không áp dụng |
| Link tài liệu/báo cáo | `D:/Semester_5/SWP391/Project/Code_Insight_Module_Architecture_Report.md` |
| Ghi chú khác | Blueprint cho Code Insight |

#### 5.8. Ghi chú thêm

```text
Đây là prompt quan trọng nhất cho hướng Code Insight.
```

---

### Prompt số 12

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

### Prompt số 13

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

### Prompt số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 04/06/2026 |
| Công cụ AI | Codex |
| Mục đích | GitHub evidence, linking, scoring, drawer |
| Phần việc liên quan | Coding / Testing / Review code |
| Mức độ sử dụng | Hỏi sinh code / Hỏi review |

#### 5.1. Prompt nguyên văn

```text
Tiếp tục Code Insight theo architecture report. Phase này cần lưu GitHub code evidence từ webhook push, pull_request, workflow_run, check_run; sau đó link evidence vào task bằng task key hoặc GitHub issue rõ ràng. Tiếp theo scoring phải dùng được commit/PR/CI evidence và UI leader có drawer xem evidence. Làm từng phần đơn giản, có test, không gọi AI ở phase này.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Review gate đã có rồi, nhưng leader chưa có evidence thật từ GitHub để quyết định.
```

#### 5.3. Kết quả AI trả về

```text
AI thêm GitHub evidence storage, webhook dispatcher/handlers, deterministic linking, scoring V2 và evidence drawer.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Code Insight bắt đầu có commit/PR/CI evidence và leader có thể xem chi tiết evidence.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em giữ linking bảo thủ, không dùng AI semantic matching để tránh link sai task.
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
| Link commit | `b933a0f`, `10e5007`, `c619e1a`, `3a6eda8` |
| File liên quan | `GitHubEvidenceServiceImpl.java`, `CodeInsightEvidenceLinkServiceImpl.java`, `CodeInsightScoringServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Evidence drawer/prompt số 14 |
| Kết quả chạy/test | Full backend tests 82/88/91/93 passed qua từng phase |
| Link tài liệu/báo cáo | Code Insight architecture report |
| Ghi chú khác | Không gọi AI ở phase này |

#### 5.8. Ghi chú thêm

```text
Prompt này làm Code Insight chuyển từ review gate trống sang review có evidence.
```

---

### Prompt số 15

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 04/06/2026 - 07/06/2026 |
| Công cụ AI | Codex |
| Mục đích | Hoàn thiện Code Insight phase 6-9 và fix CI risk |
| Phần việc liên quan | Coding / Testing / Debug |
| Mức độ sử dụng | Hỏi sinh code / Hỏi debug / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
Tiếp tục Code Insight Phase 6-9. Tôi cần fetch changed files của PR khi leader mở evidence, tạo AI review summary dạng local/safe vì chưa có provider thật, lưu audit snapshot khi approve/reject và thêm dashboard metrics. Sau đó nếu test manual thấy failed CI mà vẫn READY thì sửa risk rule để failed CI phải BLOCKED.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Code Insight đã có evidence nhưng còn thiếu changed files, summary, audit snapshot và dashboard. Sau manual test còn thấy lỗi risk failed CI.
```

#### 5.3. Kết quả AI trả về

```text
AI thêm changed file fetch/cache, local AI review summary, review snapshot, dashboard và sửa failed CI thành hard BLOCKED risk.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Leader review flow hoàn thiện hơn và failed CI không còn hiển thị READY sai.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Em giữ AI summary local, không external provider và không auto-approve. Em phát hiện case failed CI qua manual test rồi sửa lại rule.
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
| Link commit | `f92a255`, `87eee37`, `41bfb06`, `db2c023`, `a39808f`, `d7b59b0` |
| File liên quan | `CodeInsightPatchServiceImpl.java`, `CodeInsightAiReviewServiceImpl.java`, `CodeInsightReviewSnapshotServiceImpl.java`, `CodeInsightScoringServiceImpl.java`, `CodeInsightPage.jsx` |
| Screenshot | Dashboard/failed CI/prompt số 15 |
| Kết quả chạy/test | `./mvnw.cmd test` 93 tests passed; targeted scoring test passed |
| Link tài liệu/báo cáo | Code Insight architecture report |
| Ghi chú khác | Đây là mốc mới nhất tính đến 08/06/2026 |

#### 5.8. Ghi chú thêm

```text
Prompt này có phần debug sau manual test, không chỉ sinh feature mới.
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
| Prompt phân tích yêu cầu | 2 | Prompt số 1, 2 |
| Prompt giải thích kiến thức | 2 | Prompt số 3, 8 |
| Prompt thiết kế giải pháp | 3 | Prompt số 5, 11, 14 |
| Prompt thiết kế database | 2 | Prompt số 2, 3 |
| Prompt sinh code mẫu | 5 | Prompt số 5, 6, 12, 14, 15 |
| Prompt debug lỗi | 4 | Prompt số 7, 10, 13, 15 |
| Prompt viết test case | 4 | Prompt số 5, 12, 14, 15 |
| Prompt review code | 5 | Prompt số 7, 11, 13, 14, 15 |
| Prompt tối ưu code | 2 | Prompt số 13, 14 |
| Prompt viết báo cáo | 3 | Prompt số 4, 8, 11 |
| Prompt chuẩn bị thuyết trình | 1 | Prompt số 8 |
| Prompt khác | 2 | Prompt số 4, 9 |

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
| Prompt quan trọng được ghi lại đầy đủ | x | 15 prompt chính đã ghi |
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
| Nguyễn Minh Hiếu | 08/06/2026 |
