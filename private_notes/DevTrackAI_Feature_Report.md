# DevTrack AI — Báo cáo Tính năng Toàn diện
**Phiên bản:** 1.0 | **Dành cho:** Nhóm 5 người, 9 tuần | **Mục tiêu:** Đồ án môn học IT

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Module 1 — Project Workspace & IAM](#2-module-1--project-workspace--iam)
3. [Module 2 — Requirement & Use Case Management](#3-module-2--requirement--use-case-management)
4. [Module 3 — Task Board (Kanban)](#4-module-3--task-board-kanban)
5. [Module 4 — Test Case & Bug Tracking](#5-module-4--test-case--bug-tracking)
6. [Module 5 — Evidence Vault](#6-module-5--evidence-vault)
7. [Module 6 — Requirement Traceability Matrix (RTM)](#7-module-6--requirement-traceability-matrix-rtm)
8. [Module 7 — Code Insight](#8-module-7--code-insight)
9. [Module 8 — AI Engine](#9-module-8--ai-engine)
10. [Module 9 — Contribution Analytics](#10-module-9--contribution-analytics)
11. [Module 10 — Mentor Dashboard](#11-module-10--mentor-dashboard)
12. [Bảng so sánh khác biệt với công cụ hiện có](#12-bảng-so-sánh-khác-biệt-với-công-cụ-hiện-có)
13. [Phân loại theo mức độ ưu tiên MVP](#13-phân-loại-theo-mức-độ-ưu-tiên-mvp)
14. [Ước tính chi phí vận hành](#14-ước-tính-chi-phí-vận-hành)

---

## 1. Tổng quan hệ thống

### 1.1 Định vị sản phẩm

DevTrack AI là workspace quản lý project học thuật chuyên biệt cho nhóm sinh viên IT. Điểm khác biệt cốt lõi so với Trello, Jira, Notion là **traceability xuyên suốt** từ requirement đến evidence, kết hợp **AI phát hiện thiếu sót chủ động** và **Code Insight** xác minh đóng góp thực tế.

### 1.2 Luồng dữ liệu tổng thể

```
Requirement
    ↓ sinh ra
Use Case / Actor
    ↓ break down thành
Task (Development / Testing / Documentation / Design)
    ↓ hoàn thành tạo ra
Evidence (Screenshot / API Link / Test Result / Code Commit)
    ↓ xác minh bởi
Test Case → pass/fail → Bug Report
    ↓ tổng hợp vào
Traceability Matrix → Weekly Report → Contribution Analytics
    ↓ xem bởi
Mentor Dashboard
```

### 1.3 Người dùng mục tiêu

| Role | Người dùng thực tế | Quyền chính |
|---|---|---|
| Admin | Quản trị viên hệ thống | Quản lý toàn bộ |
| Project Leader | Trưởng nhóm | Tạo project, phân task, xem toàn bộ |
| Team Member | Thành viên nhóm | Nhận task, upload evidence, tạo test |
| Mentor / Supervisor | Giảng viên / Mentor | Xem toàn bộ, comment, không chỉnh sửa |

---

## 2. Module 1 — Project Workspace & IAM

### 2.1 Mô tả

Nền tảng chứa toàn bộ hệ thống. Mỗi project là một không gian làm việc độc lập với thành viên, quyền, và dữ liệu riêng.

### 2.2 Tính năng chi tiết

#### F1.1 — Tạo và quản lý Project

- Tạo project với tên, mô tả, loại (Web App / Mobile / Database / Research / Other)
- Gắn môn học, học kỳ, năm học (phục vụ filter và báo cáo sau này)
- Đặt ngày bắt đầu và deadline tổng thể
- Trạng thái project: `Planning → Active → In Review → Completed → Archived`
- Avatar/màu project để phân biệt khi người dùng tham gia nhiều project

**Điểm khác biệt:** Các công cụ như Trello không có khái niệm "môn học" hay "deadline cả dự án" — DevTrack gắn chặt với ngữ cảnh học thuật ngay từ khi tạo.

#### F1.2 — Quản lý thành viên và phân quyền

- Leader mời thành viên qua email hoặc username
- Invitation link có thời hạn (24h / 72h / 7 ngày)
- Phân role per-project (không phải global role) — cùng một người có thể là Leader ở project A, Member ở project B
- Xem lịch sử tham gia: ai join lúc nào, ai rời nhóm
- Kick member (với xác nhận) — task của người bị kick không mất, chuyển về "Unassigned"

#### F1.3 — Project Dashboard

- Vòng tròn tiến độ tổng thể: % requirement hoàn thành
- Mini Traceability status: số requirement đang At Risk (thiếu task/test/evidence)
- Sprint burndown chart cơ bản
- Activity feed: 10 hoạt động gần nhất trong project
- Days remaining đến deadline

#### F1.4 — Sprint Management

- Tạo sprint với tên, mục tiêu, ngày bắt đầu/kết thúc
- Di chuyển task vào/ra sprint
- Sprint status: `Planned → Active → Completed`
- Không cần velocity point như Jira — giữ đơn giản với task count
- Sau khi sprint Complete, task chưa done tự động chuyển sang "Backlog" hoặc sprint tiếp theo

**Lý do không dùng story point:** Sinh viên chưa có kinh nghiệm estimate — story point gây tranh cãi và không thực tế. Dùng task count và deadline là đủ để track tiến độ học thuật.

#### F1.5 — Notification System

- In-app notification (không cần real-time WebSocket trong MVP — polling 30 giây là đủ)
- Các trigger notification:
  - Task được assign cho bạn
  - Task của bạn bị comment
  - Deadline task còn 24h
  - Test case liên quan đến task của bạn vừa fail
  - AI phát hiện thiếu sót liên quan đến requirement bạn phụ trách
  - Mentor vừa comment vào project

---

## 3. Module 2 — Requirement & Use Case Management

### 3.1 Mô tả

Đây là điểm xuất phát của toàn bộ traceability chain. Requirement trong DevTrack không phải text tĩnh như Notion — nó là entity có status, owner, priority, và có thể tracking được.

### 3.2 Tính năng chi tiết

#### F2.1 — Requirement Management

Mỗi requirement gồm:

- **Tiêu đề** (ngắn, ví dụ: "User can login")
- **Mô tả chi tiết** (mô tả đầy đủ behavior mong muốn)
- **Loại:** Functional / Non-functional
- **Priority:** Critical / High / Medium / Low
- **Acceptance Criteria:** danh sách điều kiện để requirement được coi là "done" — đây là input quan trọng cho AI generate test case
- **Owner:** người phụ trách requirement (không nhất thiết là người code)
- **Status:** `Draft → In Progress → In Review → Done → Deprecated`
- **Tags:** tự do gán nhãn (ví dụ: "auth", "payment", "ui")

**Điểm khác biệt:** Acceptance Criteria là field bắt buộc (không phải optional như Jira). AI sẽ dùng chính field này để generate test case — không hallucinate.

#### F2.2 — Use Case Management

Gắn với requirement, mỗi use case gồm:

- Tên use case
- Actor(s) — ai thực hiện
- Precondition — điều kiện trước
- Main flow — luồng chính (numbered steps)
- Alternative flow — luồng thay thế
- Postcondition — kết quả sau

Use case có thể link 1-1 hoặc 1-nhiều với requirement.

#### F2.3 — Requirement Import từ text

Leader có thể paste một đoạn text mô tả yêu cầu dự án (ví dụ từ đề bài môn học), AI phân tích và tự động tách thành danh sách requirement draft. Leader review và chỉnh sửa trước khi confirm.

**Đây là tính năng AI tự nhiên và thực tế nhất cho sinh viên:** đề bài môn học thường là file Word dài — không ai ngồi tay nhập từng requirement. Tính năng này tiết kiệm 1–2 giờ setup đầu project.

#### F2.4 — Requirement Status tự động

Hệ thống tự động tính status của requirement dựa trên dữ liệu từ các module khác (không cần nhập tay):

```
Requirement status = f(task_completion, test_pass_rate, evidence_count)

- "Not Started"  : chưa có task nào
- "In Progress"  : có task, chưa done hết
- "Testing"      : task done, test case chưa pass hết  
- "At Risk"      : có task done nhưng thiếu evidence hoặc test
- "Done"         : task done + test pass + evidence đủ
```

---

## 4. Module 3 — Task Board (Kanban)

### 4.1 Mô tả

Kanban board quen thuộc nhưng tích hợp sâu hơn với requirement và evidence — task không phải card tĩnh mà là traceability node.

### 4.2 Tính năng chi tiết

#### F3.1 — Task Management

Mỗi task gồm:

- Tiêu đề và mô tả
- **Task Type:** Development / Testing / Documentation / UI/UX Design / Research / Deployment / Bug Fix / Review
- Gắn với requirement (bắt buộc — task không có requirement là backlog kỹ thuật, vẫn cho phép nhưng highlight khác)
- Assigned to (có thể gán nhiều người nhưng chọn 1 người chịu trách nhiệm chính)
- Priority và Deadline
- Checklist con (subtask dạng checkbox)
- Estimated hours (không bắt buộc — phục vụ analytics sau)
- **Status:** `Todo → In Progress → In Review → Done → Blocked`

**Trạng thái "Blocked"** là tính năng quan trọng ít tool nào làm tốt: khi task bị block, member phải điền lý do và task nào đang chặn. AI sẽ flag điều này trong weekly report.

#### F3.2 — Task Board Views

- **Kanban view:** cột theo status, kéo thả
- **List view:** bảng, sort được theo deadline/priority/assignee
- **My Tasks view:** chỉ hiện task của mình (member hay dùng nhất)
- **Sprint view:** task theo sprint

#### F3.3 — Task → Done Flow (Quan trọng)

Khi member kéo task sang "Done", hệ thống không cho phép ngay. Xuất hiện checklist xác nhận:

```
☐ Tôi đã upload ít nhất 1 evidence cho task này
☐ Task này đã được review bởi ít nhất 1 người khác (nếu là Development)
☐ Code liên quan đã được commit (nếu có)

[Confirm Done]  [Cancel]
```

Nếu không thỏa, task vẫn được mark Done nhưng hệ thống tự động tạo "Missing Evidence" flag — AI sẽ nhắc trong report.

**Điểm khác biệt sắc bén:** Trello cho kéo card sang "Done" mà không cần bất kỳ điều kiện gì. DevTrack tạo friction có chủ đích — buộc member nghĩ đến evidence trước khi claim xong việc.

#### F3.4 — Task Dependency

Task A có thể "blocked by" Task B — hiển thị trực quan trên board. Khi B Done, A tự động thoát khỏi Blocked và gửi notification cho assignee của A.

---

## 5. Module 4 — Test Case & Bug Tracking

### 5.1 Mô tả

Test Case trong DevTrack không phải file Excel rời — nó là entity liên kết với requirement, có thể track pass/fail, và từ fail có thể tạo bug ngay lập tức.

### 5.2 Tính năng chi tiết

#### F4.1 — Test Case Management

Mỗi test case gồm:

- Tiêu đề (ví dụ: "Login thành công với tài khoản hợp lệ")
- Gắn với requirement (bắt buộc)
- Loại test: Unit / Integration / UI / API / Manual
- Precondition
- Test steps (numbered)
- Expected result
- **Status:** `Not Run → Pass → Fail → Blocked`
- Actual result (điền khi run)
- Người thực thi và thời gian thực thi

#### F4.2 — Test Execution History

Mỗi lần chạy test được lưu lại — không ghi đè. Mentor/Leader xem được lịch sử: test này đã run bao nhiêu lần, lần nào pass, lần nào fail, ai run.

#### F4.3 — Bug Report

Khi test case Fail, member click "Create Bug" và hệ thống tự điền:

- Link đến test case fail
- Link đến requirement liên quan
- Severity (Critical / High / Medium / Low)
- Environment (dev / staging)
- Steps to reproduce (lấy từ test steps)
- Expected vs Actual (lấy từ test case)
- Assigned to (tự gợi ý người phụ trách task Development liên quan)

Bug lifecycle: `Open → In Progress → Fixed → Verified → Closed / Reopened`

**Khi bug Fixed:** developer mark Fixed, gắn commit hash (nếu có). Tester verify lại bằng cách run lại test case. Nếu pass → Closed. Nếu fail → Reopen.

#### F4.4 — Bug → Task liên kết

Khi bug được tạo, hệ thống tự động tạo một Task type "Bug Fix" liên kết với bug đó và gán cho developer phụ trách requirement. Developer không cần tự tạo task — giảm ma sát.

---

## 6. Module 5 — Evidence Vault

### 6.1 Mô tả

Evidence Vault là kho minh chứng trung tâm — thứ chứng minh rằng công việc thực sự được làm, không phải chỉ báo cáo trên giấy. Đây là module không có trong bất kỳ tool học thuật nào hiện tại.

### 6.2 Tính năng chi tiết

#### F5.1 — Loại evidence hỗ trợ

| Loại | Mô tả | Storage |
|---|---|---|
| Screenshot | Upload file ảnh (.png, .jpg, .gif) | Cloud storage |
| Screen recording | Upload video ngắn (< 50MB) | Cloud storage |
| GitHub commit | Paste commit URL, hệ thống fetch metadata | GitHub API |
| API response | Paste hoặc upload file JSON/HTML response | Database |
| Figma link | Paste Figma URL, tự lấy preview | Figma API |
| Test result | Upload file hoặc paste text report | Database |
| Database diagram | Upload ảnh hoặc embed link | Cloud storage |
| Deploy link | URL đến môi trường đang chạy | Database |
| Survey/feedback | Upload file hoặc link Google Form | Database |
| Document | Upload PDF, Word (report, spec) | Cloud storage |

#### F5.2 — Evidence liên kết đa chiều

Một evidence có thể gắn với nhiều entity cùng lúc:
- Requirement
- Task
- Test Case
- Bug
- Sprint

Ví dụ: Screenshot "login thành công" gắn với Requirement "User can login" + Task "Implement login UI" + Test Case "Login với tài khoản hợp lệ" — 3 liên kết, 1 upload.

#### F5.3 — Evidence Preview

Trong Traceability Matrix và Dashboard, evidence hiển thị dạng thumbnail/preview — không cần mở link mới. Click để xem full.

#### F5.4 — Evidence từ GitHub Commit (tự động)

Khi developer commit code và message có dạng `[TASK-123] implement login API`, hệ thống (qua webhook) tự động:
- Tạo evidence loại "GitHub Commit" liên kết với TASK-123
- Fetch commit metadata: author, timestamp, files changed, diff summary
- Gắn evidence vào requirement liên quan của task đó

Developer không cần vào DevTrack để upload thủ công — evidence tạo tự động từ commit. Đây là điểm quan trọng giảm friction.

#### F5.5 — Evidence Required Flag

Leader có thể đánh dấu một requirement là "Evidence Required" — khi đó, requirement không thể chuyển sang Done nếu chưa có ít nhất 1 evidence.

#### F5.6 — Evidence Validation

Evidence không được tính là hợp lệ ngay khi upload. Mỗi evidence phải đi qua quy trình xác minh gồm:

1. **Technical Validation:** kiểm tra định dạng file/link, dung lượng, khả năng truy cập, metadata.
2. **Relevance Validation:** kiểm tra evidence có liên quan đến requirement/task/test case được gắn hay không, dựa trên metadata, task ID, mô tả, OCR/AI summary hoặc rule-based matching.
3. **Human Review:** leader, tester hoặc mentor xác nhận evidence là hợp lệ trước khi được tính vào RTM.

Evidence status:
- `Pending`: vừa upload, chưa xác minh.
- `Auto Checked`: đã qua kiểm tra kỹ thuật.
- `Accepted`: được xác nhận hợp lệ và được tính vào RTM.
- `Rejected`: không hợp lệ hoặc không liên quan.
- `Needs Clarification`: cần bổ sung mô tả hoặc evidence khác.

Chỉ evidence ở trạng thái `Accepted` mới được tính vào cột Evidence của RTM và điều kiện hoàn thành requirement.

---

## 7. Module 6 — Requirement Traceability Matrix (RTM)

### 7.1 Mô tả

RTM là tính năng "ăn điểm" nhất của DevTrack. Đây là cái nhìn tổng thể một trang về toàn bộ trạng thái dự án — không cần họp, không cần hỏi từng người.

### 7.2 Tính năng chi tiết

#### F6.1 — Ma trận chính

Bảng RTM hiển thị mỗi requirement một dòng:

| Requirement | Priority | Owner | Tasks | Test Cases | Bugs Open | Evidence | Status |
|---|---|---|---|---|---|---|---|
| User can login | Critical | Văn A | 3/3 ✓ | 4 passed | 0 | 3 files | ✅ Done |
| Reset Password | High | Thị B | 1/3 | Chưa có | — | Chưa có | ⚠️ At Risk |
| View profile | Medium | — | Chưa có | Chưa có | — | Chưa có | 🔴 Not Started |

Click vào bất kỳ cell nào để xem chi tiết (task nào, test case nào, evidence nào).

#### F6.2 — Status Indicator Logic

```
✅ Done         : task 100% + test pass ≥ 80% + có evidence
⚠️ At Risk      : task done nhưng thiếu test hoặc thiếu evidence
🟡 In Progress  : có task, đang làm, chưa xong
🔴 Not Started  : chưa có task nào gắn vào
🚫 Blocked      : có task đang bị Blocked status
```

#### F6.3 — Filter & Export

- Filter theo: status, priority, owner, sprint, tag
- Export RTM ra file Excel (.xlsx) — quan trọng vì nhiều giảng viên yêu cầu nộp file
- Export ra PDF để đính vào báo cáo cuối kỳ

**Tính năng export là critical feature cho đồ án học thuật** — sinh viên cần nộp báo cáo, không phải chỉ demo.

#### F6.4 — RTM Snapshot

Tại mỗi thời điểm sprint end, hệ thống tự động lưu "snapshot" của RTM. Mentor có thể so sánh RTM tuần này vs tuần trước — thấy progress thực sự, không chỉ là báo cáo lời nói.

---

## 8. Module 7 — Code Insight

### 8.1 Mô tả

Code Insight giải quyết vấn đề "báo cáo láo" — sinh viên claim task Done nhưng thực tế chưa có code hoặc code là copy-paste. Module này dùng 3 tầng phân tích với chi phí tối ưu.

### 8.2 Kiến trúc 3 tầng

#### Tầng 1 — GitHub Metrics (Miễn phí, tự động)

Kết nối qua GitHub/GitLab OAuth. Sau khi project gắn với repo:

**Commit Analytics per Member:**
- Số commit mỗi sprint
- Thời gian commit (phát hiện commit dồn vào 11 PM ngày deadline — "panic commit pattern")
- Commit streak (ngày nào có commit, ngày nào không)
- Files touched per member — ownership map

**Contribution Heatmap:**
- GitHub-style heatmap activity calendar per member
- Lines added / deleted (không dùng làm metric duy nhất vì dễ gian lận — chỉ là tín hiệu)

**Commit Message Quality Score:**
- Quá ngắn (< 10 ký tự): flag
- Không có verb hành động: flag
- Có pattern "fix", "update", "done", "aaa": flag nhiều lần → warning
- Không có task ID reference: flag (nếu team đã thống nhất convention)

**Cross-member Code Similarity:**
- Hash-based comparison: nếu đoạn code dài > 20 dòng xuất hiện giống hệt trong commit của 2 member khác nhau → flag "Possible copy"
- Không dùng AI để làm điều này — dùng Rabin–Karp rolling hash, hoàn toàn miễn phí

#### Tầng 2 — Static Analysis (Miễn phí, trigger khi push lên main/dev)

Chạy tool open-source trên server:

- **ESLint / Pylint / Checkstyle** tùy ngôn ngữ project: đếm số lỗi, warning
- **Complexity report:** số function có cyclomatic complexity > 10 (quá phức tạp, khó test)
- **Duplication report (CPD):** % code bị duplicate trong codebase
- **Test coverage:** nếu project có unit test, đo % coverage

Kết quả lưu vào DevTrack, hiển thị trend qua các sprint.

#### Tầng 3 — AI Diff Review (Chi phí thấp, trigger thông minh)

**Trigger conditions (không trigger mỗi commit):**
- Member mark task → Done (trigger review diff của commit gắn với task đó)
- Leader/Mentor click "Request AI Review" trên một task cụ thể
- Weekly schedule (mỗi cuối tuần, review top 5 commit có diff lớn nhất)

**Payload gửi AI (không gửi full repo):**
```
Context:
  - Task: "Implement login API" (ID: TASK-123)
  - Requirement: "User can login with email and password"
  - Acceptance Criteria: [list]
  - Author: Nguyễn Văn A
  - Commit time: 2025-05-14 23:47

Git diff (chỉ file thay đổi):
  [nội dung diff, giới hạn 500 dòng]

Yêu cầu đánh giá ngắn gọn (tối đa 200 từ):
  1. Code có đúng với task và requirement không?
  2. Có vấn đề kỹ thuật nổi bật không?
  3. Điểm cần cải thiện (nếu có)?
```

**Chi phí ước tính:** ~$0.02/lần review. Team 5 người, 20 task/sprint → ~$0.40/tuần.

#### F7.4 — Code Evidence tự động trong RTM

Khi commit được phân tích (Tầng 1 hoặc 3), kết quả tự động tạo "Code Evidence" trong Evidence Vault và gắn vào task tương ứng. RTM cập nhật Evidence column tự động — không cần member vào upload thủ công.

### 8.3 Điều DevTrack KHÔNG làm với Code Insight

- Không "chấm điểm code" theo thang điểm số — gây tâm lý tiêu cực và không chính xác
- Không so sánh member này với member kia về số dòng code — metric sai
- Không tự động penalize ai — chỉ flag và gợi ý, quyết định cuối là của Mentor

---

## 9. Module 8 — AI Engine

### 9.1 Mô tả

Bốn tính năng AI giải quyết bốn vấn đề thực tế khác nhau — không phải AI "cho có". Tất cả dùng chung một API provider (khuyến nghị: Claude API hoặc OpenAI GPT-4o-mini để cân bằng chi phí/chất lượng).

### 9.2 Tính năng chi tiết

#### F8.1 — AI Generate Task từ Requirement

**Input:**
- Tiêu đề requirement
- Mô tả chi tiết
- Acceptance criteria
- Tech stack của project (khai báo lúc tạo project)
- (Optional) danh sách task đã có để tránh trùng

**Output:** Danh sách task draft với:
- Tiêu đề task
- Task type (Development/Testing/Documentation)
- Gợi ý assignee (nếu có member có tag skill phù hợp)
- Estimate (rough: 1h / 2-4h / 1 ngày / nhiều ngày)

**Ví dụ:**
```
Requirement: "User có thể đăng ký tài khoản"
Tech stack: React + Node.js + PostgreSQL

AI gợi ý:
→ [Dev] Design Register UI screen (2-4h)
→ [Dev] Create POST /api/auth/register endpoint (2-4h)
→ [Dev] Validate email format và password strength (1-2h)
→ [Dev] Hash password với bcrypt trước khi lưu (1h)
→ [Dev] Gửi email xác nhận sau đăng ký (2-4h)
→ [Test] Viết test case cho register flow (2-4h)
→ [Doc] Screenshot UI + API docs cho evidence (1h)
```

Leader review, bỏ những cái không cần, thêm nếu thiếu, rồi confirm.

**Caching:** Cùng requirement text + tech stack → cache 24h, không gọi API lại.

#### F8.2 — AI Suggest Test Case

**Input:**
- Requirement text
- Acceptance criteria
- Use case (nếu có)

**Output:** Danh sách test case draft với title, precondition, expected result phác thảo. Người dùng bổ sung test steps chi tiết.

**Ví dụ với "User can login":**
```
✅ Login thành công với email và password hợp lệ
❌ Login thất bại — password sai
❌ Login thất bại — email không tồn tại
❌ Login thất bại — email rỗng
❌ Login thất bại — password rỗng
❌ Login thất bại — email sai định dạng
❌ Login thất bại — tài khoản bị vô hiệu hóa
❌ Login thất bại — tài khoản bị khóa sau 5 lần sai liên tiếp
⚠️ Login với email có uppercase (case-insensitive check)
⚠️ Login khi server đang chậm (timeout handling)
```

#### F8.3 — AI Missing Artifact Detection

Đây là tính năng AI chạy nền — không cần trigger thủ công. Chạy mỗi ngày (hoặc khi có thay đổi lớn).

**Các pattern được detect:**

```
Cấp độ Critical (deadline gần):
- Requirement [Priority: Critical] nhưng chưa có task nào
- Task [Done] nhưng không có evidence nào sau 24h
- Test case [Fail] nhưng chưa có bug report sau 12h
- Deadline sprint còn ≤ 2 ngày, còn > 30% task chưa done

Cấp độ Warning:
- Requirement không có owner
- Task [In Progress] không có commit liên quan sau 48h
- Test pass rate của sprint < 70%
- Member không có activity trong project 3+ ngày
- Bug [Open] không có assignee
```

**Output:** Danh sách cảnh báo trong Dashboard, phân loại Critical/Warning, có link trực tiếp đến entity cần xử lý.

**Điểm khác biệt:** Không phải AI viết lời cảnh báo — logic detect là rule-based (nhanh, chính xác, miễn phí). AI chỉ được dùng để **tổng hợp và ưu tiên** danh sách cảnh báo thành đoạn văn ngắn gọn dễ đọc, kết hợp với context của project.

#### F8.4 — AI Weekly Progress Report

**Trigger:** Mỗi Chủ nhật 8 PM tự động, hoặc Leader click "Generate Report".

**Input gửi AI:**
```
Sprint data:
- Sprint name, ngày bắt đầu/kết thúc
- Task completed this week: [list với assignee]
- Task overdue: [list]
- Test cases run: X passed, Y failed
- Bugs opened: N, Bugs closed: M
- Evidence uploaded: K items
- Requirement status changes: [list]
- Missing artifacts detected: [list từ F8.3]
- Commit activity per member: [từ Code Insight]
```

**Output:** Báo cáo tiến độ tuần dưới dạng văn xuôi có cấu trúc:

```markdown
## Tuần 3 — Báo cáo Tiến độ (AI Generated)

### Tổng kết tuần này
Team hoàn thành 12/15 task đặt ra cho sprint 2...

### Ai làm gì
- Văn A: hoàn thành [Task X, Y, Z], commit 8 lần...
- Thị B: viết 5 test case, phát hiện 2 bug...

### Kết quả test
Test pass rate: 78% (14/18 cases)...

### Rủi ro tuần tới
⚠️ Requirement "Thanh toán" chưa có test case nào trong khi deadline demo còn 10 ngày...

### Action items đề xuất
1. Thị B cần viết test case cho module thanh toán trước Thứ 4
2. Bug #12 (login timeout) cần fix trước khi demo...
```

**Export:** PDF hoặc copy markdown để dán vào báo cáo môn.

---

## 10. Module 9 — Contribution Analytics

### 10.1 Mô tả

Giải quyết vấn đề "ai đóng góp gì" — câu hỏi nhạy cảm nhất trong nhóm học thuật. DevTrack không dùng một con số duy nhất để "chấm điểm" thành viên, mà hiển thị đa chiều.

### 10.2 Tính năng chi tiết

#### F9.1 — Contribution Dashboard per Member

Mỗi member có trang contribution riêng, hiển thị:

**Activity Summary:**
- Tasks completed: N (breakdown by type)
- Test cases written: N
- Test cases executed: N
- Bugs reported: N
- Bugs fixed: N
- Evidence uploaded: N
- Commits: N (từ Code Insight)

**Timeline:** Biểu đồ hoạt động theo thời gian — thấy được member nào làm đều, member nào chỉ làm cuối sprint.

**Evidence Gallery:** Toàn bộ evidence member đó đã upload — có thể dùng trực tiếp trong báo cáo cá nhân.

#### F9.2 — Team Contribution Comparison

Biểu đồ radar so sánh các member trên các chiều:
- Task completion
- Testing effort
- Documentation
- Code commits
- Bug reporting

**Quan trọng:** Radar chart hiển thị relative contribution, không phải raw number — member làm testing nhiều không bị "thua điểm" so với member code nhiều.

#### F9.3 — AI Contribution Summary

Khi Leader/Mentor click "Summarize", AI tạo đoạn văn ngắn mô tả đóng góp của từng thành viên theo ngôn ngữ tự nhiên — dùng được trực tiếp trong báo cáo tổng kết.

```
Ví dụ:
"Nguyễn Văn A đóng vai trò chính trong phần backend authentication, 
hoàn thành 8 task development với 23 commit trong 3 tuần. Anh cũng 
tích cực fix 4 bug được report bởi QA team..."
```

---

## 11. Module 10 — Mentor Dashboard

### 11.1 Mô tả

Mentor không cần tài khoản đặc biệt phức tạp. View của Mentor là read-only, tập trung vào oversight — xem tiến độ, không can thiệp vào workflow của team.

### 11.2 Tính năng chi tiết

#### F10.1 — Project Overview

- Danh sách tất cả project Mentor được assign
- Mini dashboard mỗi project: % requirement done, sprint hiện tại, risk count
- Sắp xếp project theo: deadline gần nhất, risk cao nhất

#### F10.2 — Deep Dive View

Mentor có thể xem đầy đủ:
- Toàn bộ RTM của project
- Contribution analytics của từng member
- Tất cả weekly report đã generate
- Evidence vault (không thể upload, chỉ xem)
- Code Insight summary (không xem raw code, chỉ xem metrics và AI review)

#### F10.3 — Mentor Comment

Mentor có thể comment trên:
- Requirement (góp ý về scope hoặc acceptance criteria)
- Weekly report (phản hồi về tiến độ)
- Specific task (nhắc nhở)

Comment của Mentor có badge riêng màu khác — team thấy ngay đây là feedback quan trọng.

#### F10.4 — Shareable Report Link

Leader có thể generate link báo cáo public (read-only, không cần login) để chia sẻ với Mentor hoặc nộp cho giảng viên. Link có thời hạn (7 ngày / 30 ngày / vĩnh viễn).

---

## 12. Bảng so sánh khác biệt với công cụ hiện có

| Tính năng | DevTrack AI | Trello | Jira | Notion | GitHub Projects |
|---|:---:|:---:|:---:|:---:|:---:|
| Requirement → Task traceability | ✅ | ❌ | ⚠️ (phức tạp) | ❌ | ❌ |
| Test Case gắn với Requirement | ✅ | ❌ | ✅ (add-on trả tiền) | ❌ | ❌ |
| Evidence Vault tích hợp | ✅ | ❌ | ❌ | ❌ | ❌ |
| Traceability Matrix (RTM) | ✅ | ❌ | ⚠️ (cấu hình phức tạp) | ❌ | ❌ |
| AI generate task từ requirement | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI suggest test case | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI missing artifact detection | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI weekly progress report | ✅ | ❌ | ❌ | ❌ | ❌ |
| Code Insight (commit → evidence) | ✅ | ❌ | ⚠️ (plugin) | ❌ | ⚠️ (chỉ commit) |
| Contribution analytics đa chiều | ✅ | ❌ | ⚠️ (basic) | ❌ | ⚠️ (chỉ commit) |
| Phù hợp sinh viên IT (UX đơn giản) | ✅ | ✅ | ❌ | ✅ | ⚠️ |
| Export báo cáo học thuật | ✅ | ❌ | ⚠️ (có nhưng phức tạp) | ⚠️ | ❌ |
| Mentor read-only view | ✅ | ⚠️ (board view) | ✅ | ⚠️ | ❌ |
| Miễn phí hoàn toàn | ✅ (self-host) | ✅ (freemium) | ❌ | ✅ (freemium) | ✅ |

---

## 13. Phân loại theo mức độ ưu tiên MVP

### Must-Have (Tuần 1–7)

Không có những thứ này thì không có sản phẩm:

1. Auth (login/register/role)
2. Project Workspace + Member Management
3. Requirement Management (F2.1)
4. Task Board Kanban (F3.1, F3.2, F3.3)
5. Test Case & Bug Tracking (F4.1, F4.2, F4.3, F4.4)
6. Evidence Vault — upload thủ công (F5.1, F5.2)
7. Traceability Matrix — view chính (F6.1, F6.2)
8. AI Generate Task (F8.1)
9. AI Suggest Test Case (F8.2)
10. AI Missing Artifact Detection (F8.3)
11. AI Weekly Report (F8.4)
12. Sprint Management (F1.4)

### Should-Have (Tuần 6–8, nếu còn time)

Làm được thì demo ấn tượng hơn, không có vẫn pass:

13. Code Insight — Tầng 1 GitHub Metrics (F7.1)
14. Code Evidence tự động từ commit (F5.4)
15. RTM Export Excel/PDF (F6.3)
16. Contribution Analytics Dashboard (F9.1, F9.2)
17. Mentor Dashboard (F10.1, F10.2, F10.3)
18. Requirement Import từ text AI (F2.3)

### Nice-to-Have (Sau MVP hoặc cắt)

Không nên làm trong 9 tuần:

19. Code Insight — Tầng 2 Static Analysis (F7.2)
20. Code Insight — Tầng 3 AI Diff Review (F7.3)
21. RTM Snapshot history (F6.4)
22. Task Dependency (F3.4)
23. Shareable Report Link (F10.4)
24. AI Contribution Summary (F9.3)
25. Screen recording upload (F5.1 — video)

---

## 14. Ước tính chi phí vận hành

### Chi phí AI API (per project, per tuần)

| Tính năng | Tần suất | Token estimate | Chi phí ($) |
|---|---|---|---|
| AI Generate Task | 1–2 lần/sprint | ~2.000 token/lần | ~$0.01 |
| AI Suggest Test Case | 5–10 lần/sprint | ~1.500 token/lần | ~$0.05 |
| AI Missing Artifact Detection summary | Daily | ~500 token/lần | ~$0.02/tuần |
| AI Weekly Report | 1 lần/tuần | ~3.000 token/lần | ~$0.02 |
| AI Diff Review (nếu làm) | 10–20 lần/sprint | ~5.000 token/lần | ~$0.50 |
| **Tổng (không có Diff Review)** | | | **~$0.10/tuần/project** |
| **Tổng (có Diff Review)** | | | **~$0.60/tuần/project** |

Với 20 team dùng đồng thời: **$2–12/tuần** — hoàn toàn trong tầm tay cho đồ án môn học.

### Chi phí Infrastructure

| Dịch vụ | Mục đích | Chi phí |
|---|---|---|
| Railway / Render / Fly.io | Deploy backend | Free tier đủ cho demo |
| Vercel / Netlify | Deploy frontend | Free |
| Supabase / Neon | PostgreSQL database | Free tier 500MB |
| Cloudinary / Supabase Storage | File storage (evidence) | Free tier 25GB |
| **Tổng** | | **$0/tháng cho demo** |

---

*Tài liệu này là nền tảng để team đi sâu vào: User Flow chi tiết từng tính năng, Use Case specification, Implementation guide cho third-party integration, và Risk mitigation strategy.*

---

## 15. Change Logs & Bug Fixes

### Date: 2026-05-21
- **Feature: Authentication & Registration (Module 1 - IAM)**
  - **Bug Fixed:** Registration failed with 500 Internal Server Error.
  - **Root Cause:** 
    1. Missing seed data for `system_roles` causing `ResourceNotFoundException` during OTP verification step.
    2. Email sending exceptions (`MailSendException`) were escaping the catch block in `EmailServiceImpl`, causing 500 errors during the OTP request step.
    3. The email sending method `sendOtpEmail` was running synchronously. Since connecting to Gmail SMTP can take >15 seconds on a slow network, the frontend Axios instance (configured with a 15000ms timeout) aborted the request. This resulted in the user receiving the email but the frontend displaying a network error ("Không thể kết nối đến máy chủ").
  - **Resolution:** 
    - Created migration `V20260521235000__seed_system_and_project_roles.sql` to seed `USER` and `ADMIN` roles in `system_roles` and roles in `project_roles`.
    - Broadened exception catching in `EmailServiceImpl.sendOtpEmail` to catch generic `Exception` and return HTTP 400 Bad Request.
    - Improved frontend `RegisterPage.jsx` to show appropriate error message for HTTP 500.
    - Fixed phone regex validation in `RegisterRequest.java`.
    - Added `@Async` to `EmailServiceImpl.sendOtpEmail` so that the API responds immediately (under 50ms) and the email is sent in a background thread, completely avoiding the frontend timeout issue.

### Date: 2026-05-22
- **Feature: Project Workspace (Module 1 - Member Management)**
  - **Bug Fixed:** 500 Error when inviting a member via `inviteMember` API.
  - **Root Cause:** The system uses WebSocket for direct, targeted member invitations. This requires the `ProjectInvitation` entity (which tracks `invitee_id` and `status`). However, the `project_invitations` table was never created in the database schemas. (Note: `invitation_links` exists but serves a different purpose for public, role-based shareable links).
  - **Resolution:**
    - Created migration `V20260522002000__create_project_invitations_table.sql` to create the `project_invitations` table with foreign keys linking to `projects` and `user_accounts`.
- **Feature: Notification System**
  - **Bug Fixed:** `PSQLException` indicating `column "type" is of type notification_type_enum but expression is of type character varying` when sending a notification (e.g., during the invite member flow).
  - **Root Cause:** The PostgreSQL database defines `notifications.type` as a custom ENUM type `notification_type_enum`. However, the Java `Notification` entity was using generic `@Enumerated(EnumType.STRING)`, causing Hibernate to send a standard `VARCHAR`, which Postgres rejected.
  - **Resolution:**
    - Added `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` to the `type` field in `Notification.java` so Hibernate correctly casts the enum to the Postgres custom enum.
  - **Bug Fixed:** `invalid input value for enum notification_type_enum: "INVITATION"` when saving a Notification.
  - **Root Cause:** The database's `notification_type_enum` only contained values `('TASK_ASSIGNED', 'TASK_COMMENTED', 'DEADLINE_NEAR', 'TEST_FAILED', 'AI_ALERT', 'MENTOR_COMMENT')`. The Java `NotificationType.java` Enum introduced `INVITATION`, `SYSTEM`, and `MENTION` which were missing from the database schema.
  - **Resolution:**
    - Created migration `V20260522005000__add_values_to_notification_type_enum.sql` to execute `ALTER TYPE notification_type_enum ADD VALUE '...'` to add the missing values.
- **Feature: Project Workspace (Module 1 - Member Management)**
  - **Bug Fixed:** UI Caching Issue: When a member accepts an invitation and joins the project, their dashboard shows the correct member count (e.g., 2), but the Project Leader's dashboard still shows the old member count (e.g., 1) until the cache expires (10 minutes).
  - **Root Cause:** In `ProjectServiceImpl.acceptInvitation`, after adding the new member to `project_members`, the system called `evictUserProjectsCache(userId);` which ONLY evicted the cache for the new member (`userId`). The Leader's cache (`projects:user:{leaderId}:*`) was not cleared.
  - **Resolution:**
    - Created a new helper method `evictProjectCacheForAllMembers(Long projectId)` in `ProjectServiceImpl.java` which looks up all current members of the project and evicts their caches.
    - Updated `acceptInvitation`, `removeMember`, `changeProjectLeader`, and `changeMemberRole` to use this new helper to ensure all project members see synchronized data after any roster mutation.
