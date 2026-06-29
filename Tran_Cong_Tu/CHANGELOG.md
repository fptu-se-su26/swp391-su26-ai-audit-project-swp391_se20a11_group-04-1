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
| Học kỳ | SUMMER 2026 |
| Tên bài tập / Project | Software Project Management System for IT Student Teams |
| Tên sinh viên / Nhóm | Trần Công Tú |
| MSSV / Danh sách MSSV | SE202611 |
| Giảng viên hướng dẫn | Quang Lê |
| Repository URL | github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1 |
| Ngày bắt đầu | 18/05/2026 |
| Ngày hoàn thành | 27/06/2026 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 18/05 - 24/05 | Khởi tạo project & Code Giao diện (UI) đẫm Mock Data | Completed |
| Phase 02 | 25/05 - 30/05 | Code Backend API & Chức năng CRUD | Completed |
| Phase 03 | 01/06 - 10/06 | Ghép Frontend/Backend, Fix E2E & Code React Flow | Completed |
| Phase 04 | 11/06 - 15/06 | Testing, Tối ưu hiệu năng Undo/Redo & WebSockets | Completed |
| Phase 05 | 16/06 - 22/06 | Hợp thức hóa Tài liệu (Gen ngược RE, UC, Task) | Completed |
| Phase 06 | 23/06 - 27/06 | CI/CD DevOps & Báo cáo Demo | Completed |

---

# [Phase 01] Khởi tạo project & Code Giao diện (UI)

## Ngày thực hiện

```text
18/05/2026 - 24/05/2026
```

## Đã hoàn thành

- [x] Tạo repository, thư mục gốc và file .gitignore
- [x] Lên ý tưởng cốt lõi (Task Management, Peer-review, UML)
- [x] Nhờ AI lên khung giao diện bằng React & TailwindCSS với CSS Grid
- [x] Code màn hình Dashboard hiển thị danh sách Task
- [x] Tích hợp thủ công thư viện Chart.js thay vì dùng bản AI gen
- [x] Setup Toolpad Sidebar kéo thả cho Module UML

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Khởi tạo repo và cập nhật danh sách Idea sơ bộ | Trần Công Tú | README.md | Commit init |
| 2 | Code giao diện quản lý Task (cứng) với CSS Grid 2 cột | Trần Công Tú | Dashboard.tsx | UI Screenshot |
| 3 | Tự tay gắn thư viện Chart.js hiển thị biểu đồ rỗng | Trần Công Tú | ChartComponent.tsx | Code diff |
| 4 | Code thanh công cụ Sidebar chứa 3 nút kéo thả (Class, Enum, Interface) | Trần Công Tú | Sidebar.tsx | Giao diện |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
- Dùng Gemini để brainstorm ý tưởng cốt lõi. 
- Dùng Stitch gen toàn bộ code CSS Grid cho layout 2 cột. 
- Do thói quen sinh viên "thích nhìn thấy cái đẹp trước", tôi đã nhờ AI đẻ ra toàn bộ đống code giao diện TailwindCSS có sẵn dữ liệu giả (Mock data array) để nhìn cho sướng mắt.
```

## Commit/Screenshot minh chứng

```text
Commit: Init project, brainstorm ideas and add UI mockups.
```

## Ghi chú

```text
Giao diện cực kỳ đẹp nhưng chứa đầy kỹ thuật nợ (Technical Debt). AI nhét 1 đống mảng giả làm UI trông như thật.
```

---

# [Phase 02] Code Backend API & Chức năng CRUD

## Ngày thực hiện

```text
25/05/2026 - 30/05/2026
```

## Đã hoàn thành

- [x] Tích hợp hệ thống quản lý Database Migration (Knex) để quản lý cấu trúc PostgreSQL.
- [x] Từ chối sửa DB bằng tay (pgAdmin), thay bằng script Knex có Optimistic Locking.
- [x] Viết API Create, Read, Update, Delete (CRUD) cho Task.
- [x] Bổ sung schema Zod thay thế luồng validate if-else lộn xộn cũ.
- [x] Code API Authentication (JWT Login/Register) và Phân quyền Role.
- [x] Bổ sung cơ chế bắt lỗi TokenExpiredError để tăng tính bảo mật.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Setup cấu trúc Database Migration với Knex | Trần Công Tú | knexfile.js, migrations/ | Các file SQL |
| 2 | Viết Middleware kiểm tra User Token phân quyền Role | Trần Công Tú | auth.middleware.js | Test trên Postman |
| 3 | Chức năng Create Task với field estimate_hours | Trần Công Tú | task.controller.js | Test trên Postman |
| 4 | Bổ sung schema Zod validate dữ liệu đầu vào | Trần Công Tú | task.validator.js | Code diff |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
- Dùng Claude thiết kế kiến trúc DB và Antigravity viết lệnh init Knex Migration.
- Dùng Antigravity code Controller lưu xuống PostgreSQL, nhưng đã chủ động yêu cầu Claude sinh Zod validation thay vì tự tay viết.
- Dùng Antigravity code Auth middleware nhưng tự bổ sung cơ chế bắt lỗi TokenExpiredError.
```

## Commit/Screenshot minh chứng

```text
Commit: Add Backend CRUD APIs, Knex Migration and JWT Auth.
```

## Ghi chú

```text
Cảm giác đê mê khi gọi Postman trả về status 200 xanh lè. Nhưng đây mới là lúc AI lười biếng bắt đầu lừa dối.
```

---

# [Phase 03] Ghép Frontend/Backend, Fix E2E & Code React Flow

## Ngày thực hiện

```text
01/06/2026 - 10/06/2026
```

## Đã hoàn thành

- [x] Bóc sạch Mock Data, gọi Axios fetch API thực tế.
- [x] Sửa lỗi API báo 200 nhưng PostgreSQL không có data mới (E2E Testing bug).
- [x] Sửa lỗi CORS và Login không gửi kèm Cookie do thiếu SameSite.
- [x] Lên thiết kế kiến trúc luồng xử lý Node/Edge (Master Prompt) trước khi code UML.
- [x] Chốt dùng React Flow có tính năng Drag Drop.
- [x] Code component UmlDiagram hiển thị bản vẽ.
- [x] Sửa lỗi đứt dây kết nối (Edge) giữa 2 khối UML.

## Danh sách lỗi đã xử lý

| STT | Lỗi phát hiện | Nguyên nhân | Cách xử lý | Trạng thái |
|---:|---|---|---|---|
| 1 | API báo 200 nhưng DB trống | Antigravity chỉ in console.log truy vấn chứ lười không gọi hàm pool.query. | Bắt quả tang qua log, ép AI dùng đúng hàm kết nối DB. | Fixed |
| 2 | Trình duyệt chặn API (Lỗi CORS) | Do chạy 2 port khác nhau và thiếu cấu hình Cookie SameSite. | Dùng Kiro quét lỗi. Cập nhật server.js cấu hình allowed origin và credentials. | Fixed |
| 3 | Kéo dây React Flow không dính | ID Handle định nghĩa trong Node lệch với ID hàm onConnect. | Dùng Kiro trace bug, cập nhật lại yêu cầu để Antigravity đồng bộ ID. | Fixed |
| 4 | UI không update data | Do bị hardcode mock data ngày đầu. | Bóc tách mảng giả, ép dùng fetch API. | Fixed |

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Dọn dẹp dữ liệu Mock trên Dashboard | Trần Công Tú | Dashboard.tsx | Commit log |
| 2 | Sửa API lưu vật lý xuống PostgreSQL | Trần Công Tú | task.controller.js | Check trên DB |
| 3 | Fix CORS và Credentials Header | Trần Công Tú | server.js | Network tab |
| 4 | Viết Master Prompt kiến trúc React Flow | Trần Công Tú | docs/Architecture.md | Bản thiết kế |
| 5 | Implement React Flow và Fix lỗi đứt dây | Trần Công Tú | UmlDiagram.jsx | Màn hình vẽ |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
- Dùng Kiro kiểm tra lỗi E2E Fake DB và lỗi CORS cực kỳ chuẩn xác.
- Dùng Claude và Gemini nghiên cứu sâu React Flow để vạch ra Master Prompt.
- Dùng Antigravity gen component UmlDiagram dựa trên bản thiết kế.
```

## Commit/Screenshot minh chứng

```text
Commit: Fix E2E Bugs, Integrate APIs and Implement React Flow.
```

## Ghi chú

```text
Giai đoạn vỡ mộng đau đớn nhất. Ghép API vào giao diện bị dội ngược bởi CORS và Mock Data. Đọc log mờ cả mắt.
```

---

# [Phase 04] Testing, Debug & Tối ưu hiệu năng

## Ngày thực hiện

```text
11/06/2026 - 15/06/2026
```

## Đã hoàn thành

- [x] Sửa lỗi giật lag giao diện (tụt FPS) khi thêm xóa node nhiều lần.
- [x] Cấu trúc lại cơ chế lưu State Undo/Redo bằng kỹ thuật Debouncing.
- [x] Tích hợp React Error Boundary chặn lỗi Crash UI do đụng độ dữ liệu Optimistic Locking.
- [x] Đập bỏ component UmlDiagram.jsx khổng lồ 1500 dòng thành các Custom Hook riêng biệt (Separation of Concerns).
- [x] Cải thiện kiến trúc WebSocket truyền data để đỡ ngốn băng thông mạng và CPU (Delta Update).

## Danh sách lỗi đã xử lý

| STT | Lỗi phát hiện | Nguyên nhân | Cách xử lý | Trạng thái |
|---:|---|---|---|---|
| 1 | Undo/Redo làm web giật cục | AI lưu toàn bộ object khổng lồ vào mảng mỗi khi nhích chuột 1 pixel. | Đập bỏ, nhờ Claude viết lại bằng Debounce và Delta. | Fixed |
| 2 | Màn hình trắng bóc khi đụng DB | DB throw error Optimistic Locking nhưng Frontend không đỡ. | Bọc React Error Boundary ngoài cùng App, hiện UI cảnh báo lịch sự. | Fixed |
| 3 | WebSockets sập server | AI gửi nguyên mảng data hàng MB lên server mỗi giây. | Ép AI dùng thuật toán Delta Update (chỉ gửi tọa độ x,y thay đổi). | Fixed |

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết custom hook useUndoRedo tối ưu | Trần Công Tú | useUndoRedo.js | Commit lag fix |
| 2 | Bọc ErrorBoundary cho UI | Trần Công Tú | ErrorBoundary.jsx | Màn hình lỗi |
| 3 | Refactor băm nhỏ file 1500 dòng | Trần Công Tú | hooks/useUmlState.js | Thư mục gọn |
| 4 | Tối ưu thuật toán mạng WebSocket | Trần Công Tú | socket.js | Network payload nhỏ |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
- Kiro bắt đúng bệnh giật lag do clone data.
- Claude cung cấp thuật toán Debounce và Delta Update cực đỉnh để nén data mạng.
- Claude vẽ ra cấu trúc băm nhỏ file để Antigravity chia tách thành 5 file con.
```

## Commit/Screenshot minh chứng

```text
Commit: Refactor 1500-line component, optimize WebSockets and fix Memory Leak.
```

## Ghi chú

```text
Khẳng định đẳng cấp Developer. Ép AI phải tối ưu hiệu năng thay vì chỉ biết viết code chạy được.
```

---

# [Phase 05] Hoàn thiện Tài liệu (Gen RE, UC, Task)

## Ngày thực hiện

```text
16/06/2026 - 22/06/2026
```

## Đã hoàn thành

- [x] Sinh tài liệu Yêu cầu (Requirement Specification) dịch ngược từ mã nguồn.
- [x] Phân tách danh sách Use Case dựa trên chức năng thực tế của Web.
- [x] Phân rã Work Breakdown Structure (WBS) thành file Excel lùi ngày về quá khứ.
- [x] Tự gỡ bỏ các tính năng dư thừa do AI tự chém gió thêm (như Approve Task, Chat).

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Sinh tài liệu Requirement từ code | Trần Công Tú | docs/Requirement.md | File document |
| 2 | Đẻ danh sách Use Case khớp giao diện | Trần Công Tú | docs/UseCase.md | File document |
| 3 | Chế file Excel Task WBS lùi timeline | Trần Công Tú | docs/WBS.xlsx | File Excel |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Do thói quen sinh viên "đâm đầu vào code trước, làm tài liệu sau", tôi đã quăng nguyên cục source code Frontend/Backend cực ngon cho Claude và Gemini. Yêu cầu AI: "Mày hãy nhìn code tao viết, và đẻ ngược ra cho tao tài liệu Requirement, Use Case, và bảng Task y hệt như tao đã lên kế hoạch từ đầu dự án để tao đem nộp thầy!". AI làm xuất sắc.
```

## Commit/Screenshot minh chứng

```text
Commit: Add reverse-engineered Requirement and Use Case documents.
```

## Ghi chú

```text
Mánh khóe kinh điển của sinh viên (Reverse Engineering Document). Code chạy mượt rồi mới làm tài liệu để hợp thức hóa quy trình đối phó giảng viên.
```

---

# [Phase 06] Đóng gói CI/CD & Báo cáo Demo

## Ngày thực hiện

```text
23/06/2026 - 27/06/2026
```

## Đã hoàn thành

- [x] Soạn thảo file Hướng dẫn sử dụng (User Manual / README).
- [x] Gắn hình ảnh screenshot thực tế của app vào tài liệu.
- [x] Setup GitHub Actions tự động Deploy (CI/CD) lên Render.
- [x] Cấu hình biến môi trường DATABASE_URL cho luồng CI/CD.

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết file README markdown có mục lục | Trần Công Tú | README.md | File Markdown |
| 2 | Code luồng deploy tự động CI/CD | Trần Công Tú | .github/workflows/deploy.yml | Script YAML |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
- Dùng Claude draft bản thô cho User Manual.
- Dùng Gemini sinh script YAML cho GitHub Actions, đưa dự án lên tầm vóc tự động hóa DevOps.
```

## Commit/Screenshot minh chứng

```text
Commit: Finalize project docs and setup DevOps CI/CD pipeline.
```

## Ghi chú

```text
Khép lại một dự án làm ngược quy trình đau khổ nhưng kết quả cực kỳ mỹ mãn, bảo mật tốt, hiệu năng cao.
```

---

# 4. Tổng kết thay đổi cuối project

## 4.1. Các chức năng đã hoàn thành

| STT | Chức năng | Trạng thái | Minh chứng | Ghi chú |
|---:|---|---|---|---|
| 1 | Quản lý Task CRUD | Completed | Demo Web | Auth đầy đủ, Zod Validation |
| 2 | Vẽ UML kéo thả | Completed | Demo Web | React Flow, bọc Error Boundary |
| 3 | Vẽ chung Realtime | Completed | Demo Web | Tối ưu mạng bằng Delta Update |
| 4 | Deploy tự động (DevOps) | Completed | GitHub Repo | Có CI/CD Pipeline |

---

## 4.2. Các chức năng chưa hoàn thành

| STT | Chức năng | Lý do chưa hoàn thành | Hướng cải thiện |
|---:|---|---|---|
| 1 | Module Mentor chấm chéo | Dành quá nhiều thời gian debug tích hợp UI và API | Đã bóc tính năng này ra khỏi Requirement bản nộp |

---

## 4.3. Tổng hợp AI hỗ trợ trong project

| Hạng mục | AI có hỗ trợ không? | Mức độ hỗ trợ | Ghi chú |
|---|---|---|---|
| Requirement | Có | Nhiều | Dùng để dịch ngược code ra tài liệu ở cuối môn |
| Design | Có | Nhiều | Xin code giao diện CSS tĩnh ngay ngày đầu |
| Database | Có | Nhiều | Thiết kế schema Knex Migration cực chuẩn |
| Coding | Có | Nhiều | Sinh hàm CRUD, Middleware Auth |
| Debug | Có | Nhiều | Bắt bệnh lười của AI E2E, Fix CORS, Undo/Redo |
| Testing | Có | Ít | Chủ yếu là sinh viên tự test tay (Monkey Testing) |
| Tối ưu code | Có | Nhiều | Thuật toán Debounce, Delta Update, Băm file 1500 dòng |
| DevOps | Có | Nhiều | Tự động hóa CI/CD GitHub Actions |
| Report | Có | Nhiều | Format báo cáo chuẩn form, viết User Manual |

---

## 4.4. Bài học rút ra

```text
Làm sinh viên ai cũng thích xin AI code cho có giao diện trước để lấy cảm hứng. Nhưng hậu quả của việc bỏ qua khâu Phân tích Yêu Cầu và Cấu trúc Data là lúc ghép API bị lật mặt (CORS, Fake Data, Lag RAM). Việc lấy mã nguồn đẻ ngược ra tài liệu ở phút 89 cứu được điểm số, nhưng nó chứng minh SDLC thực sự quan trọng thế nào. Lần sau làm chuẩn sẽ không phải thức đêm fix bug đập đi xây lại rườm rà.
```

---

## 4.5. Hướng cải thiện tiếp theo

```text
Nếu được làm lại, em sẽ nghiêm túc yêu cầu AI viết Master Prompt phân tích Requirement và Use Case ngay từ ngày đầu, chốt Database xong mới được gõ dòng code giao diện đầu tiên.
```

---

# 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Trần Công Tú | 27/06/2026 |
