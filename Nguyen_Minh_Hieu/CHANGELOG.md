# Changelog

## 1. Quy định ghi Changelog

File này dùng để ghi lại các thay đổi quan trọng trong quá trình thực hiện bài tập, lab, assignment hoặc project.

Nguyên tắc ghi changelog:

- Chỉ ghi những gì đã hoàn thành thật sự.
- Không ghi kế hoạch nếu chưa thực hiện.
- Mỗi thay đổi nên có ngày, nội dung, người thực hiện và minh chứng.
- Nếu có AI hỗ trợ, cần ghi rõ AI đã hỗ trợ phần nào.
- Nếu có commit GitHub, cần ghi link commit.
- Nếu có lỗi đã sửa, cần ghi rõ lỗi, nguyên nhân và cách xử lý.

---

## 2. Thông tin project

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
| Repository URL | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1 |
| Ngày bắt đầu | 11/05/2026 |
| Ngày hoàn thành | 08/06/2026 (bản cập nhật hiện tại) |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 11/05/2026 - 18/05/2026 | Khởi tạo project, thông tin nhóm, backend foundation và AI audit template | Completed |
| Phase 02 | 11/05/2026 - 21/05/2026 | Phân tích yêu cầu, use case, ERD và hướng traceability | Completed |
| Phase 03 | 21/05/2026 - 30/05/2026 | Thiết kế RTM, Sprint, Code Insight architecture và milestone materials | Completed |
| Phase 04 | 22/05/2026 - 07/06/2026 | Implementation RTM, Sprint Weekly Planning và Code Insight theo phase | Completed for current scope |
| Phase 05 | 22/05/2026 - 07/06/2026 | Testing, debug, merge support, cache/runtime fixes và CI risk fix | Completed for current scope |
| Phase 06 | 27/05/2026 - 08/06/2026 | Hoàn thiện tài liệu milestone, Jira backfill và AI audit cá nhân | Completed for current scope |

---

# [Phase 01] Khởi tạo project

## Ngày thực hiện

```text
11/05/2026 - 18/05/2026
```

## Đã hoàn thành

- [x] Tạo repository
- [x] Tạo cấu trúc thư mục project
- [x] Tạo file README.md
- [x] Tạo thư mục `docs/`
- [x] Tạo file `AI_AUDIT_LOG.md`
- [x] Tạo file `PROMPTS.md`
- [x] Tạo file `REFLECTION.md`
- [x] Tạo file `CHANGELOG.md`
- [x] Khởi tạo source code ban đầu
- [x] Cài đặt thư viện/công cụ cần thiết
- [x] Cấu hình môi trường chạy project

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Cập nhật thông tin thành viên nhóm và username GitHub của Nguyễn Minh Hiếu | Nguyễn Minh Hiếu | `README.md` | Commits `c7ce365`, `f55471e` |
| 2 | Khởi tạo backend Spring Boot, PostgreSQL và Flyway foundation | Nguyễn Minh Hiếu | `code/backend/pom.xml`, `code/backend/src/main/resources/db/migration` | Commit `a9ba9d2` |
| 3 | Cập nhật AI audit template ban đầu trong folder cá nhân | Nguyễn Minh Hiếu | `Nguyen_Minh_Hieu/AI_AUDIT_LOG.md` | Commit `bdb8708` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ brainstorm cách tổ chức project và nhắc lại convention backend nhiều lớp: controller, service, repository, entity, DTO và Flyway migration. Em tự kiểm tra lại cấu hình thật trong repo trước khi áp dụng.
```

## Commit/Screenshot minh chứng

```text
c7ce365, f55471e, a9ba9d2, bdb8708
```

## Ghi chú

```text
Phase này chủ yếu là setup nền. Chưa ghi các module lớn là hoàn thành ở giai đoạn này.
```

---

# [Phase 02] Phân tích yêu cầu

## Ngày thực hiện

```text
11/05/2026 - 21/05/2026
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
- [x] Review yêu cầu với giảng viên/nhóm
- [x] Chỉnh sửa yêu cầu sau feedback

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Chọn hướng DevTrack AI: workspace hỗ trợ nhóm sinh viên IT theo traceability/evidence | Nguyễn Minh Hiếu và nhóm | README, tài liệu tổng hợp dự án | AI log prompt số 1 |
| 2 | Phân tích flow Requirement -> Use Case -> Task -> Test Case -> Bug -> Evidence -> RTM -> Report | Nguyễn Minh Hiếu và nhóm | tài liệu `usecase.md`, feature report | AI log prompt số 2 |
| 3 | Xác định các actor/module liên quan: Leader, Member, Mentor, Admin, GitHub System, AI Engine | Nguyễn Minh Hiếu và nhóm | use case/report docs | AI log prompt số 2 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ brainstorm yêu cầu, actor, use case và entity chính. Nhóm tự điều chỉnh scope để phù hợp thời gian môn học, tránh làm một hệ thống AI quá rộng.
```

## Commit/Screenshot minh chứng

```text
README commits, tài liệu trong `D:/Semester_5/SWP391/Project/project_tailieu`, prompt số 1-2 trong `PROMPTS.md`.
```

## Ghi chú

```text
Các phần requirement/use case là công việc nhóm. Trong log cá nhân này chỉ ghi phần em tham gia và các quyết định ảnh hưởng tới module em làm.
```

---

# [Phase 03] Thiết kế hệ thống

## Ngày thực hiện

```text
21/05/2026 - 30/05/2026
```

## Đã hoàn thành

- [x] Thiết kế kiến trúc tổng quan
- [x] Thiết kế database/ERD
- [x] Thiết kế API
- [x] Thiết kế giao diện/wireframe
- [x] Thiết kế flow xử lý
- [x] Thiết kế class diagram
- [x] Thiết kế sequence diagram
- [x] Thiết kế security/authorization flow
- [x] Review thiết kế
- [x] Chỉnh sửa thiết kế sau feedback

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Thiết kế RTM là module read-only tổng hợp requirement/task/test/bug/evidence | Nguyễn Minh Hiếu | `implementation_plan_module6_MTR.md`, RTM files | Prompt số 5 |
| 2 | Thiết kế Sprint Weekly Planning là timebox cho task, không tạo/sửa task thay Task Board | Nguyễn Minh Hiếu | Sprint module plan, `features/sprint` | Prompt số 6 |
| 3 | Viết lại Code Insight architecture theo hướng GitHub evidence + rule score + AI summary + leader approval | Nguyễn Minh Hiếu | `Code_Insight_Module_Architecture_Report.md` | Prompt số 11 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ review kiến trúc, gợi ý API, status/risk rule, cách chia phase và cách trình bày report. Em tự ràng buộc lại để không vượt scope và không chạm sai module của thành viên khác.
```

## Commit/Screenshot minh chứng

```text
RTM commit `0301fe8`, Sprint commit `fb46446`, Code Insight architecture report ngoài repo.
```

## Ghi chú

```text
Thiết kế Code Insight ban đầu chưa phải toàn bộ implementation; một số phần được implement sau từ 01/06/2026 đến 07/06/2026.
```

---

# [Phase 04] Implementation

## Ngày thực hiện

```text
22/05/2026 - 07/06/2026
```

## Đã hoàn thành

- [x] Tạo project structure
- [x] Cài đặt database connection
- [x] Xây dựng backend
- [x] Xây dựng frontend
- [ ] Xây dựng authentication/authorization
- [x] Xử lý CRUD
- [x] Xử lý validation
- [x] Tích hợp API
- [ ] Xử lý upload/download file
- [x] Xử lý lỗi
- [x] Tối ưu giao diện
- [x] Cập nhật README hướng dẫn chạy

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Implement RTM live matrix, summary, detail và snapshot | Nguyễn Minh Hiếu | `RtmController.java`, `RtmServiceImpl.java`, `features/rtm` | Commit `0301fe8` |
| 2 | Fix task route/status để thao tác liên quan task không bị redirect sai sau khi RTM/task UI dùng chung route | Nguyễn Minh Hiếu | `TaskController.java`, frontend task routes/services | Commits `ee0e288`, `ce74907` |
| 3 | Implement Sprint Weekly Planning: Sprint CRUD, assign/remove task, `sprint_plan_date`, weekly planner | Nguyễn Minh Hiếu | `SprintController.java`, `SprintServiceImpl.java`, `features/sprint` | Commit `fb46446` |
| 4 | Implement Code Insight review gate và project config | Nguyễn Minh Hiếu | `CodeInsightController.java`, `TaskServiceImpl.java`, `CodeInsightPage.jsx` | Commits `4558e65`, `fbf504d`, `0345985`, `6a9fd4d`, `14b8c12` |
| 5 | Implement Code Insight GitHub evidence, linking, scoring, evidence drawer, patch fetch, AI summary, snapshots và dashboard | Nguyễn Minh Hiếu | Code Insight backend/frontend services, migrations, tests | Commits `b933a0f`, `10e5007`, `c619e1a`, `3a6eda8`, `f92a255`, `87eee37`, `41bfb06`, `db2c023` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ chia implementation thành từng phase, sinh/review code, viết test và giải thích rủi ro. Em kiểm tra lại code thật, chạy test và chỉnh scope. Với các phần chạm module khác như Task và GitHub Integration, em ghi rõ lý do: RTM chỉ đọc dữ liệu, Sprint chỉ plan task có sẵn, Code Insight dùng shared GitHub Integration để không duplicate với Issue Tracker.
```

## Commit/Screenshot minh chứng

```text
0301fe8, ee0e288, ce74907, fb46446, 9d5a16f, 0793eb4, 4558e65, fbf504d, 0345985, 6a9fd4d, 14b8c12, 786ec38, 57f85b6, b933a0f, 10e5007, c619e1a, 3a6eda8, f92a255, 87eee37, 41bfb06, db2c023, a39808f, d7b59b0
```

## Ghi chú

```text
Code Insight được làm theo phase. AI review hiện tại là local structured summary, chưa phải external LLM provider. Auth/authorization và upload/download file có trong codebase nhóm nhưng không phải phần chính em phụ trách, nên không đánh dấu là đóng góp cá nhân ở phase này.
```

---

# [Phase 05] Testing & Debug

## Ngày thực hiện

```text
22/05/2026 - 07/06/2026
```

## Đã hoàn thành

- [x] Viết test case
- [x] Chạy test chức năng chính
- [x] Kiểm tra output
- [x] Kiểm tra validation
- [x] Kiểm tra lỗi giao diện
- [x] Kiểm tra lỗi database
- [x] Kiểm tra phân quyền
- [x] Kiểm tra bảo mật cơ bản
- [x] Fix bug
- [x] Chạy lại sau khi fix bug
- [x] Ghi nhận kết quả test

## Danh sách lỗi đã xử lý

| STT | Lỗi phát hiện | Nguyên nhân | Cách xử lý | Trạng thái |
|---:|---|---|---|---|
| 1 | UI My Projects không thấy project sau khi seed trực tiếp bằng pgAdmin | Redis cache giữ project list cũ | Xác minh database, clear Redis cache hoặc refresh/re-login; ghi lại rule seed/cache | Fixed/Documented |
| 2 | `HashGeneratorRunner` chạy mỗi lần startup và có hard-coded path | Class helper có `@Component` và `CommandLineRunner` | Cleanup/remove helper vì chỉ dùng tạo BCrypt hash seed | Fixed |
| 3 | Sprint có nguy cơ overlap hoặc nhiều ACTIVE sprint | Business rule chưa đủ chặt ở service layer | Thêm validation overlap, active sprint và reassign task | Fixed |
| 4 | Code Insight GitHub config bị trùng với Issue Tracker GitHub Integration | Hai hướng config GitHub song song | Refactor Code Insight dùng shared `github_integrations`, giữ behavior Issue Tracker | Fixed |
| 5 | Failed CI/check vẫn có thể hiển thị READY nếu numeric score còn cao | Risk rule chỉ dựa score threshold | Thêm hard gate: failed CI/check -> `BLOCKED` | Fixed |

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Chạy test/backend build cho RTM | Nguyễn Minh Hiếu | RTM backend/frontend | 34 backend tests passed; frontend build passed ngày 22/05 |
| 2 | Chạy test/backend compile cho Sprint và parser check frontend | Nguyễn Minh Hiếu | Sprint backend/frontend | Backend compile/test passed ngày 27/05; Vite sandbox `spawn EPERM` documented |
| 3 | Chạy targeted/full tests cho Code Insight và sửa failed CI risk | Nguyễn Minh Hiếu | Code Insight services/tests | Full backend tests 82/88/91/93 passed; targeted scoring test passed |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ phân tích nguyên nhân lỗi, đề xuất test case và sửa logic. Em không chỉ dựa vào AI mà kiểm tra bằng database, git diff, Maven test, frontend build và manual case.
```

## Commit/Screenshot minh chứng

```text
0793eb4, 8ba65de, 1f8f308, 786ec38, a39808f, d7b59b0; test records trong `MODULE_IMPLEMENTATION_TECHNIQUE_LOG.md`.
```

## Ghi chú

```text
Frontend `npm run build` có lúc bị sandbox `spawn EPERM`, nhưng build đã chạy được ngoài sandbox theo log. Đây là lỗi môi trường, không phải syntax của file đã đổi.
```

---

# [Phase 06] Hoàn thiện báo cáo và demo

## Ngày thực hiện

```text
27/05/2026 - 08/06/2026
```

## Đã hoàn thành

- [x] Hoàn thiện source code
- [x] Hoàn thiện README.md
- [x] Hoàn thiện report
- [x] Hoàn thiện slide
- [ ] Hoàn thiện video demo
- [x] Kiểm tra lại `AI_AUDIT_LOG.md`
- [x] Kiểm tra lại `PROMPTS.md`
- [x] Hoàn thiện `REFLECTION.md`
- [x] Kiểm tra lại `CHANGELOG.md`
- [x] Đóng gói bài nộp

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Chuẩn bị use case diagram và script milestone cho phần RTM/Code Insight/Mentor Review | Nguyễn Minh Hiếu | `05_part5_usecase_diagrams.md`, `module5_presentation_script.md` | Prompt số 8 |
| 2 | Dựng Jira backfill từ git history/codebase và chỉ giữ task có evidence | Nguyễn Minh Hiếu | `jira_backfill_task_breakdown.md` | Prompt số 9 |
| 3 | Tổng hợp 15 log AI có giá trị nhất vào 4 file nộp và 1 file minh chứng prompt | Nguyễn Minh Hiếu | `AI_AUDIT_LOG.md`, `PROMPTS.md`, `CHANGELOG.md`, `REFLECTION.md`, `AI_EVIDENCE_PROMPT_SCRIPT.md` | Bản cập nhật 08/06/2026 |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ tổng hợp log từ hai file nguồn, nhưng nội dung được đối chiếu lại với git history, codebase, test records và field của 4 file nộp. Không thêm field ngoài template.
```

## Commit/Screenshot minh chứng

```text
Tài liệu hiện tại trong `Nguyen_Minh_Hieu/`; file minh chứng prompt dùng để chụp màn hình với agent khác.
```

## Ghi chú

```text
Không ghi các công việc tương lai sau 08/06/2026 là đã hoàn thành. Ngày 24/07/2026 chỉ là mốc kế hoạch tổng dự án, không dùng làm completion trong changelog hiện tại. Video demo cuối kỳ chưa được ghi là hoàn thành ở bản cập nhật này.
```

---

# 4. Tổng kết thay đổi cuối project

## 4.1. Các chức năng đã hoàn thành

| STT | Chức năng | Trạng thái | Minh chứng | Ghi chú |
|---:|---|---|---|---|
| 1 | RTM live matrix và snapshot | Completed | Commit `0301fe8`, RTM tests/build | Read-only, không sửa dữ liệu module khác |
| 2 | Sprint Weekly Planning | Completed | Commit `fb46446`, `0793eb4` | Sprint plan task có sẵn, không tạo task mới |
| 3 | Code Insight Review Gate + Config | Completed | Commits 01/06/2026 | Nền review gate cho leader |
| 4 | Code Insight GitHub Evidence + Scoring + Drawer | Completed | Commits 04/06/2026 | Dùng shared GitHub Integration |
| 5 | Code Insight Patch/AI Summary/Snapshot/Dashboard + CI risk fix | Completed | Commits `f92a255`..`d7b59b0` | AI summary local, failed CI -> BLOCKED |

---

## 4.2. Các chức năng chưa hoàn thành

| STT | Chức năng | Lý do chưa hoàn thành | Hướng cải thiện |
|---:|---|---|---|
| 1 | External LLM provider thật cho Code Insight AI review | Hiện tại chưa có provider config ổn định và cần tránh phụ thuộc API ngoài | Sau này thêm provider layer thay cho local structured summary |
| 2 | Semantic evidence linking bằng AI | Rủi ro link sai task nếu chưa đủ dữ liệu và test | Chỉ triển khai sau khi có rule kiểm chứng và manual approval |
| 3 | Full production demo/video cho toàn bộ flow | Bản hiện tại mới ghi nhận đến 08/06/2026 | Làm sau khi nhóm hoàn thiện data/demo cuối kỳ |

---

## 4.3. Tổng hợp AI hỗ trợ trong project

| Hạng mục | AI có hỗ trợ không? | Mức độ hỗ trợ | Ghi chú |
|---|---|---|---|
| Requirement | Có | Nhiều | Brainstorm scope và traceability |
| Design | Có | Nhiều | RTM, Sprint, Code Insight architecture |
| Database | Có | Trung bình | Gợi ý ERD/migration, sinh viên kiểm tra schema |
| Coding | Có | Nhiều | Hỗ trợ implement theo phase |
| Debug | Có | Nhiều | Cache, merge, Sprint rule, CI risk |
| Testing | Có | Trung bình | Gợi ý targeted/full tests |
| Report | Có | Nhiều | Architecture report, milestone script, audit logs |
| Presentation | Có | Trung bình | Use case diagram/script |

---

## 4.4. Bài học rút ra

```text
Em học được rằng changelog phải đi theo bằng chứng thật: commit, file, test hoặc tài liệu. Với AI, không nên ghi chung chung là "AI làm giúp", mà phải nói rõ AI hỗ trợ phần nào và mình đã kiểm tra/chỉnh sửa gì. Khi module chạm vào phần của người khác, ví dụ RTM đọc dữ liệu module khác hoặc Code Insight dùng GitHub Integration của Issue Tracker, phải ghi rõ cách xử lý để không hiểu nhầm là mình làm thay hoặc phá behavior cũ.
```

---

## 4.5. Hướng cải thiện tiếp theo

```text
Sau mốc 08/06/2026, nếu tiếp tục phát triển thì nên bổ sung external AI provider có cấu hình rõ ràng, data demo ổn định, thêm manual/e2e test cho review flow và cập nhật Jira/audit ngay sau mỗi sprint thay vì để cuối giai đoạn mới backfill.
```

---

# 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Nguyễn Minh Hiếu | 08/06/2026 |
