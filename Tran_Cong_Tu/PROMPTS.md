# Prompt Log

## 1. Thông tin chung

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
| Ngày bắt đầu | 18/05/2026 |
| Ngày cập nhật gần nhất | 27/06/2026 |

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

- [ ] ChatGPT
- [x] Gemini
- [x] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [x] Công cụ khác: Stitch, Kiro

---

## 4. Bảng tổng hợp prompt đã sử dụng

| STT | Ngày | Công cụ AI | Mục đích | Prompt tóm tắt | Kết quả chính | Có sử dụng vào bài không? | Minh chứng |
|---:|---|---|---|---|---|---|---|
| 1 | 18/05/26 | Gemini | Tìm ý tưởng đồ án | Tư vấn module cúp lõi quản lý đồ án sinh viên | Chốt Module UML, Task | Có | README |
| 2 | 19/05/26 | Stitch | Mockup UI Dashboard | Xin code HTML/Tailwind CSS tĩnh cho sướng mắt | UI Dashboard tĩnh | Có | Dashboard.tsx |
| 3 | 20/05/26 | Stitch | Sidebar Toolpad UML | Tạo thanh công cụ kéo thả | UI Sidebar | Có | Sidebar.tsx |
| 4 | 21/05/26 | Kiro | Bóc Mock data UI | Trị bệnh UI hardcode dữ liệu giả | Khung gọi API Axios | Có | Dashboard.tsx |
| 5 | 22/05/26 | Claude | Setup DB Migration | Xin kiến trúc Knex PostgreSQL | Thư mục Migrations | Có | migrations/ |
| 6 | 23/05/26 | Antigravity| Code API Create Task | Sinh hàm CRUD, validate bằng Zod | API chạy Postman 200 | Có | task.controller.js|
| 7 | 24/05/26 | Kiro | Bug E2E 200 Fake | Phát hiện AI lười không gọi pool.query vào DB | Fix lưu thật xuống DB | Không | task.controller.js|
| 8 | 25/05/26 | Antigravity| Code Auth JWT | Viết middleware check Role, check Expired token | Middleware phân quyền | Có | auth.middleware.js|
| 9 | 26/05/26 | Kiro | Lỗi CORS | Hỏi tại sao trình duyệt chặn API | Cấu hình SameSite Cookie | Không | Log phân tích |
| 10 | 27/05/26 | Antigravity| Fix CORS | Ép AI sửa file server.js theo lỗi Kiro chỉ | Cấu hình CORS chuẩn | Có | server.js |
| 11 | 28/05/26 | Gemini | So sánh lib UML | Hỏi chọn React Flow, JointJS hay GoJS | Chốt dùng React Flow | Có | Package.json |
| 12 | 29/05/26 | Claude | Master Prompt React Flow| Dựng cấu trúc State Json JSON quản lý Node/Edge | Bản vẽ kiến trúc rành mạch | Có | Kiến trúc code |
| 13 | 01/06/26 | Antigravity| Implement React Flow | Code màn hình kéo thả dựa trên Master Prompt | Component UmlDiagram | Có | UmlDiagram.jsx |
| 14 | 02/06/26 | Kiro | Lỗi đứt dây | Kéo dây nhưng không lưu state | Lệch ID Handle | Không | Log phân tích |
| 15 | 03/06/26 | Antigravity| Fix onConnect | Sửa hàm nối Node đồng bộ ID Handle | Kéo nối mượt mà | Có | UmlDiagram.jsx |
| 16 | 05/06/26 | Kiro | Undo/Redo giật lag | Tụt FPS do lưu mảng 10MB mỗi lần kéo chuột | Đề xuất Delta & Debounce | Có | useUndoRedo.js |
| 17 | 08/06/26 | Antigravity| Tối ưu Debounce | Cài Lodash debounce xử lý Undo | Web mượt trở lại | Có | useUndoRedo.js |
| 18 | 10/06/26 | Kiro | Crash UI Optimistic | Màn hình trắng bóc khi 2 user đụng độ save | Bọc Error Boundary | Có | ErrorBoundary.jsx |
| 19 | 12/06/26 | Claude | Refactor file 1500 dòng | Băm nhỏ UmlDiagram.jsx thành 5 custom hooks | Code gọn, dễ fix lỗi | Có | Hooks folders |
| 20 | 14/06/26 | Claude | Tối ưu WebSocket | Sập server do spam data, chuyển sang Delta Update| Truyền tọa độ x,y nhỏ gọn| Có | socket.js |
| 21 | 16/06/26 | Claude | Gen RE (Requirement) | Quăng code cho AI dịch ngược ra tài liệu RE nộp thầy| File Requirement siêu chuẩn | Có | Requirement.md |
| 22 | 17/06/26 | Gemini | Gen UC (Use Case) | Từ Requirement đẻ ra danh sách Use Case khớp code | Use Case Diagram text | Có | UseCase.md |
| 23 | 18/06/26 | Claude | Gen Task (WBS) | Chế bảng excel công việc lùi ngày về quá khứ | File Excel WBS khớp timeline| Có | WBS.xlsx |
| 24 | 22/06/26 | Claude | Viết User Manual | Sinh hướng dẫn cài đặt chạy web | File Markdown README | Có | README.md |
| 25 | 25/06/26 | Gemini | CI/CD Pipeline | Viết kịch bản deploy.yml đẩy tự động lên Render | Pipeline xanh mượt | Có | deploy.yml |

---

## 5. Prompt chi tiết

> Dưới đây là 25 prompt chi tiết mô tả rõ ràng quá trình "code trước, sửa lỗi, đẻ tài liệu sau" cực kỳ chân thực.

---

### Prompt số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 18/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Tìm ý tưởng module đồ án |
| Phần việc liên quan | Requirement |
| Mức độ sử dụng | Hỏi ý tưởng |

#### 5.1. Prompt nguyên văn

```text
Chào bạn, hiện tại nhóm chúng tôi đang lên ý tưởng để làm một đồ án tốt nghiệp cho môn học SWP391. Tên đề tài dự kiến là "Software Project Management System for IT Student Teams". Yêu cầu của giảng viên là không được làm một hệ thống chung chung như Jira hay Trello, mà phải có những chức năng bám sát vào việc sinh viên làm đồ án trên trường. Bạn hãy tư vấn giúp tôi các module cốt lõi cần phải có, tập trung vào việc quản lý tiến độ, và cơ chế đánh giá điểm số.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Ngày đầu dự án, cần chốt tính năng khác biệt để báo cáo GVHD duyệt đề tài.
```

#### 5.3. Kết quả AI trả về

```text
Gemini gợi ý module Task, Đánh giá chéo Peer-review, và Vẽ UML tích hợp.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Chốt 3 module chính: Task, UML, và Đánh giá chéo.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Lọc bỏ các tính năng nhắn tin (Chat) dư thừa để tập trung chuyên môn.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [x] Prompt tạo ra kết quả tốt

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Chốt đề tài |
| File liên quan | README.md |

---

### Prompt số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 19/05/2026 |
| Công cụ AI | Stitch |
| Mục đích | Xin code giao diện tĩnh tĩnh |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Hiện tại tôi đang cần thiết kế giao diện cho trang Dashboard quản lý dự án. Yêu cầu giao diện phải sáng sủa, hiện đại và sử dụng thư viện TailwindCSS. Cấu trúc DOM cần thiết kế nông và gọn gàng, sử dụng CSS Grid. Trang Dashboard sẽ bao gồm một Sidebar bên trái chứa các menu điều hướng, một Header hiển thị thông tin người dùng đang đăng nhập, và phần nội dung chính chứa danh sách Task. Cứ đập dữ liệu giả (Mock data) vào cho tôi xem nó hiện lên thế nào đã.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Lười phân tích hệ thống, đâm đầu xin code giao diện cho đẹp mắt để có động lực code.
```

#### 5.3. Kết quả AI trả về

```text
Giao diện React với TailwindCSS rất lung linh, nhưng chứa 1 đống mảng giả `mockTasks`.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Lấy nguyên file Dashboard.tsx vứt vào chạy thử, web lên hình cực đẹp.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Phát hiện code JSX lồng nhau tới 1000 dòng, phải tự tách thành Sidebar.jsx và TaskTable.jsx.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [ ] Prompt tạo ra kết quả tốt
- [x] Cần tự kiểm tra và chỉnh sửa nhiều (Bị ngợp code rác).

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Init UI Dashboard |
| File liên quan | Dashboard.tsx |

---

### Prompt số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 20/05/2026 |
| Công cụ AI | Stitch |
| Mục đích | Thêm thanh công cụ Toolpad |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Bây giờ tôi cần thiết kế giao diện cho phần công cụ vẽ biểu đồ UML. Bạn hãy tạo cho tôi một component Sidebar nằm dọc ở bên trái màn hình chứa 3 nút bấm tương ứng với 3 loại hình khối: Class, Interface, và Enum. Yêu cầu quan trọng là các nút bấm này phải có khả năng kéo thả (Drag and Drop) HTML5.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Tiếp tục chuỗi ngày xin code giao diện tĩnh tĩnh cho sướng mắt.
```

#### 5.3. Kết quả AI trả về

```text
Giao diện Sidebar kéo thả rất đẹp.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng Sidebar.tsx vào trang UmlBoard.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
AI quên hàm onDragStart của HTML5, em phải tự thêm vào thì mới kéo được Icon.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | Sidebar.tsx |

---

### Prompt số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 21/05/2026 |
| Công cụ AI | Kiro |
| Mục đích | Trị bệnh giao diện giả mạo |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Tôi phát hiện cái Dashboard AI tạo hôm trước toàn là dữ liệu tĩnh hardcode trong mảng. Bấm nút Thêm Task chả có tác dụng gì. Hãy hướng dẫn tôi bóc toàn bộ mảng này ra, setup React Query kết hợp Axios để gọi API thực tế.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Đến lúc phải kết nối API, nhận ra cục UI kia vô dụng nếu không có luồng State động.
```

#### 5.3. Kết quả AI trả về

```text
Kiro hướng dẫn bóc mock data, thay bằng `useQuery`.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Xóa sạch dữ liệu tĩnh, giao diện chuyển sang trạng thái Loading xoay xoay chờ API.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Chấp nhận web trống không, quyết tâm code Backend đàng hoàng để trả data thật.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt tạo ra kết quả tốt

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | Dashboard.tsx |

---

### Prompt số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 22/05/2026 |
| Công cụ AI | Claude |
| Mục đích | Setup Database Migration |
| Phần việc liên quan | Database |
| Mức độ sử dụng | Thiết kế giải pháp |

#### 5.1. Prompt nguyên văn

```text
Dự án của tôi sử dụng PostgreSQL. Tôi không muốn dùng lệnh ALTER TABLE thủ công trên pgAdmin. Hãy tư vấn cho tôi cách dùng Knex.js để quản lý Database Migration. Hướng dẫn tôi cấu hình file knexfile.js và viết script tạo bảng Tasks đầu tiên. Có tích hợp Optimistic Locking (thêm trường version).
```

#### 5.2. Bối cảnh khi viết prompt

```text
Chuẩn bị code Backend, cần kiến trúc Database đàng hoàng.
```

#### 5.3. Kết quả AI trả về

```text
Hướng dẫn setup thư mục migrations và file config.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng toàn bộ luồng Migration.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Bóc password DB ra khỏi file config, chuyển sang dùng biến môi trường `.env`.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt tạo ra kết quả tốt

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | knexfile.js |

---

### Prompt số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/05/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Viết API CRUD có Validate |
| Phần việc liên quan | Backend |
| Mức độ sử dụng | Sinh code |

#### 5.1. Prompt nguyên văn

```text
Bây giờ, hãy viết cho tôi API POST /api/tasks để tạo công việc mới. Input nhận vào từ body sẽ bao gồm title, description, assignee_id, và estimate_hours. Logic nghiệp vụ yêu cầu phải validate dữ liệu bằng thư viện Zod, nếu chuỗi rỗng thì chặn lại. Sau đó lưu xuống PostgreSQL.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Đang cần gấp API để nuôi Frontend.
```

#### 5.3. Kết quả AI trả về

```text
Controller API tạo task đầy đủ Zod validation.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Controller chạy qua Postman trả về 200 Success.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Test thấy Postman báo xanh, tưởng đã hoàn hảo.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt có vẻ tốt (nhưng chứa lỗi ngầm).

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | task.controller.js |

---

### Prompt số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/05/2026 |
| Công cụ AI | Kiro |
| Mục đích | Dò lỗi API Fake |
| Phần việc liên quan | Debug |
| Mức độ sử dụng | Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Tôi vừa test thử API tạo Task bằng Postman báo 200 Success. Tuy nhiên khi tôi mở pgAdmin thì bảng Tasks trống trơn. Đoạn code controller này đang có vấn đề gì? Có phải nó chỉ in console.log mà không lưu DB?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Nhận thấy có sự lừa đảo từ code AI sinh ra trước đó.
```

#### 5.3. Kết quả AI trả về

```text
Phát hiện Antigravity chỉ in câu query ra console thay vì gọi `pool.query`.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Yêu cầu đập đi viết lại phần tương tác DB vật lý.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Hình thành quy tắc E2E Testing, không tin tưởng mù quáng vào status 200.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng, bắt bệnh chính xác.

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | task.controller.js |

---

### Prompt số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 25/05/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Code Auth JWT |
| Phần việc liên quan | Backend |
| Mức độ sử dụng | Sinh code |

#### 5.1. Prompt nguyên văn

```text
Bạn hãy viết cho tôi một đoạn Middleware có nhiệm vụ kiểm tra và giải mã JWT token từ header của request. Hệ thống có 3 role chính là ADMIN, MENTOR, và STUDENT. Middleware này cần nhận tham số role đầu vào và đối chiếu với role trong token, xử lý luôn cả lỗi TokenExpiredError.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Cần chặn các endpoint để bảo mật trước khi ghép UI.
```

#### 5.3. Kết quả AI trả về

```text
Middleware authJwt.js.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Gắn vào các route CRUD Task.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Bổ sung thêm log để dễ trace lỗi phân quyền lúc chạy thực tế.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt tạo ra kết quả tốt

---

### Prompt số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 26/05/2026 |
| Công cụ AI | Kiro |
| Mục đích | Dò lỗi CORS |
| Phần việc liên quan | Debug |
| Mức độ sử dụng | Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Đang gặp lỗi CORS! Đăng nhập thành công, server trả Cookie JWT đàng hoàng nhưng mấy API sau Frontend gọi lên bị trình duyệt chặn đỏ lòm, không gửi kèm Cookie. SameSite có liên quan gì không?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Ghép Frontend (port 3000) và Backend (port 8080) thì sụp đổ luồng gọi API.
```

#### 5.3. Kết quả AI trả về

```text
Giải thích chi tiết về `credentials: true` và CORS Origin.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Hiểu rõ nguyên nhân để chuẩn bị fix.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
(Không có, chuẩn bị nhờ AI cấu hình).
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt tìm ra bệnh chính xác.

---

### Prompt số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Fix CORS server.js |
| Phần việc liên quan | Backend |
| Mức độ sử dụng | Sinh code |

#### 5.1. Prompt nguyên văn

```text
Dựa trên nguyên nhân CORS trên, hướng dẫn tôi cấu hình lại file server.js trong Express. Cấu hình thư viện cors cho phép credentials, và set cookie httpOnly, SameSite=None, Secure=true.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Triển khai giải pháp fix CORS.
```

#### 5.3. Kết quả AI trả về

```text
Đoạn mã cấu hình `app.use(cors({ ... }))` chuẩn xác.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng vào server.js, lỗi CORS biến mất.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sử dụng `.env.CLIENT_URL` thay vì hardcode localhost để mốt deploy không phải sửa code.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt tạo ra kết quả tốt.

---

### Prompt số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 28/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Chọn thư viện UML |
| Phần việc liên quan | Architecture |
| Mức độ sử dụng | Hỏi giải pháp |

#### 5.1. Prompt nguyên văn

```text
So sánh chi tiết 3 thư viện vẽ biểu đồ trên React: React Flow, JointJS, và GoJS. Tiêu chí: Mã nguồn mở, tài liệu dễ đọc, khả năng tùy biến Node cao để vẽ Class Diagram.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Xong cục CRUD Task, giờ bước vào tính năng xương sống: Vẽ sơ đồ.
```

#### 5.3. Kết quả AI trả về

```text
Chốt hạ React Flow vì hoàn toàn free và tùy biến cực mạnh bằng React Component.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Cài `npm install reactflow`.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự mình quyết định loại bỏ GoJS dù tính năng xịn vì dính license thương mại.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt phân tích kiến trúc rất tốt.

---

### Prompt số 12

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 29/05/2026 |
| Công cụ AI | Claude |
| Mục đích | Dựng Master Prompt React Flow |
| Phần việc liên quan | Architecture |
| Mức độ sử dụng | Thiết kế giải pháp |

#### 5.1. Prompt nguyên văn

```text
Vạch ra cho tôi một bản thiết kế kiến trúc toàn diện (Master Prompt) để dùng React Flow vẽ Class Diagram. Mô tả rõ cấu trúc State JSON lưu Node, Edge, cách tạo điểm neo (Handle) và luồng dữ liệu khi kéo thả.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Không dám đâm đầu vào xin code React Flow ngay vì sợ nó sinh rác như hồi xin code UI ngày đầu.
```

#### 5.3. Kết quả AI trả về

```text
Bản thiết kế data logic chuẩn xác, rõ ràng.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Dùng bản text này làm kim chỉ nam cho coder AI ở bước sau.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Review bản thiết kế và đảm bảo ID của Node được gen bằng UUID.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Rất chuyên nghiệp, đúng chuẩn SDLC.

---

### Prompt số 13

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 01/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Implement React Flow |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Sinh code |

#### 5.1. Prompt nguyên văn

```text
Dựa trên Master Prompt dưới đây, hãy code component UmlDiagram.jsx bằng React Flow. Lắng nghe sự kiện kéo thả từ Sidebar, thả vào Canvas thì thêm Custom Node mới vào state.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Biến bản vẽ thiết kế thành code thực tế.
```

#### 5.3. Kết quả AI trả về

```text
Component UmlDiagram hiển thị Node thành công.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Code chạy lên hình, kéo Node vào Canvas được.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Lỗi kéo đường nối Edge không dính (Sẽ nhờ Kiro debug).
```

#### 5.6. Đánh giá chất lượng prompt

- [x] AI sinh code sát với kiến trúc nhưng vẫn hụt logic nối dây.

---

### Prompt số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 02/06/2026 |
| Công cụ AI | Kiro |
| Mục đích | Bug đứt dây React Flow |
| Phần việc liên quan | Debug |
| Mức độ sử dụng | Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Custom Node hiển thị thành công nhưng khi kéo đường dây (Edge) từ Handle này sang Handle khác thì không dính, kéo chuột ra là biến mất. Đọc log và xem file CustomNode.jsx này tìm nguyên nhân onConnect fail.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Tính năng kéo thả nối dây không hoạt động.
```

#### 5.3. Kết quả AI trả về

```text
ID Handle định nghĩa trong Node không khớp với ID Handle mà hàm onConnect nhận được.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Hiểu nguyên nhân, chuẩn bị bắt Antigravity sửa.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự review lại toàn bộ cách đặt tên Handle trong đồ án.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Phát hiện lỗi chính xác.

---

### Prompt số 15

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 03/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Fix onConnect React Flow |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Sinh code |

#### 5.1. Prompt nguyên văn

```text
Dựa trên nguyên nhân lỗi ID Handle bị lệch, viết lại logic onConnect. Đảm bảo ID tuân thủ quy tắc: Handle trên là 'top-handle', dưới là 'bottom-handle'. Dùng hàm addEdge của React Flow để lưu Edge vào state.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Sửa luồng dây nối cho biểu đồ.
```

#### 5.3. Kết quả AI trả về

```text
Hàm onConnect chuẩn xác, nối được Node với nhau.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Lưu Edge thành công. Sơ đồ UML hoạt động.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
(Hoàn thành tính năng cốt lõi).
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Lỗi được giải quyết triệt để.

---

### Prompt số 16

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 05/06/2026 |
| Công cụ AI | Kiro |
| Mục đích | Tìm bệnh giật lag Undo/Redo |
| Phần việc liên quan | Optimize |
| Mức độ sử dụng | Hỏi debug |

#### 5.1. Prompt nguyên văn

```text
Web giật tung chảo! Cứ mỗi lần kéo 1 Node lệch 1 pixel là đơ mất 1 giây. Đây là code useUndoRedo.js, có phải do việc lưu clone toàn bộ mảng State hàng ngàn Node mỗi giây gây tràn RAM không?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Đang xài mượt thì bị lag do tràn bộ nhớ (Memory Leak).
```

#### 5.3. Kết quả AI trả về

```text
Đúng! Thuật toán Deep Clone chạy vô tội vạ làm sập FPS. Đề xuất dùng Debounce và Delta.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Hiểu bản chất của giật lag DOM.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sẵn sàng đập bỏ toàn bộ file Undo/Redo AI viết trước đó để làm lại đàng hoàng.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt tìm ra lỗi hiệu năng cực gắt.

---

### Prompt số 17

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 08/06/2026 |
| Công cụ AI | Antigravity |
| Mục đích | Tối ưu Debounce Undo |
| Phần việc liên quan | Optimize |
| Mức độ sử dụng | Sinh code |

#### 5.1. Prompt nguyên văn

```text
Viết lại toàn bộ custom hook Undo/Redo. Dùng Lodash debounce để gộp các thao tác kéo thả liên tục (delay 200ms) thành 1 lần lưu lịch sử. Chỉ lưu phần thay đổi (delta) thay vì clone toàn mảng.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Khôi phục hiệu năng web mượt mà.
```

#### 5.3. Kết quả AI trả về

```text
Hook useUndoRedo.js xịn xò.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng vào web, FPS ổn định 60.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự test và điều chỉnh delay từ 500ms (AI suggest) xuống 200ms để bắt kịp tay người kéo chuột.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Code sinh ra chất lượng và tối ưu.

---

### Prompt số 18

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 10/06/2026 |
| Công cụ AI | Kiro |
| Mục đích | Fix Crash UI trắng xóa |
| Phần việc liên quan | Frontend Resilience |
| Mức độ sử dụng | Hỏi giải pháp |

#### 5.1. Prompt nguyên văn

```text
Nhờ cái Optimistic Locking, CSDL đã chặn được lỗi 2 người sửa chung 1 Task. Nhưng mà Frontend văng mẹ màn hình trắng xóa bực cả mình vì không đỡ được Exception đó. Hướng dẫn tôi bọc Error Boundary trong React để bắt lỗi này, hiển thị nút Reload lịch sự.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Giao diện đứt gánh vì DB throw error lên trên nhưng Frontend không bắt.
```

#### 5.3. Kết quả AI trả về

```text
Code mẫu React ErrorBoundary class component.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Bọc `ErrorBoundary` ngoài cùng App.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Trang trí lại cái màn hình lỗi xịn xò có hình icon mếu khóc thay vì thông báo text khô khan AI viết.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Tăng trải nghiệm UX/UI cực cao.

---

### Prompt số 19

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 12/06/2026 |
| Công cụ AI | Claude |
| Mục đích | Băm nhỏ file code rác (Refactor) |
| Phần việc liên quan | Architecture |
| Mức độ sử dụng | Tái cấu trúc |

#### 5.1. Prompt nguyên văn

```text
File UmlDiagram.jsx phình to 1500 dòng rồi. Nó ôm đồm quá nhiều việc từ vẽ UI, gọi API, đến bắt Socket. Bạn hãy áp dụng Separation of Concerns, vạch ra thiết kế băm file này thành 5 custom hooks (useUmlState, useSocket...) và các component nhỏ gọn.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Code bốc mùi (Code smell), muốn bảo trì cũng không dám sửa dòng nào sợ sập.
```

#### 5.3. Kết quả AI trả về

```text
Kiến trúc băm file siêu chuẩn, chia cắt Logic và UI.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Dùng kiến trúc này ép Antigravity tách file vật lý.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Mạnh tay dọn dẹp các Technical Debt do việc hối hả xin code ngay đầu dự án.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Trả lại sự trong sáng cho mã nguồn.

---

### Prompt số 20

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 14/06/2026 |
| Công cụ AI | Claude |
| Mục đích | Tối ưu Data mạng WebSocket |
| Phần việc liên quan | Optimize Networking |
| Mức độ sử dụng | Thiết kế thuật toán |

#### 5.1. Prompt nguyên văn

```text
Kéo UML chung Real-time bị đơ do Socket cứ gửi toàn bộ mảng JSON to đùng lên Server liên tục. Mới 5 user kéo là nghẽn cổ chai mạng rồi. Đề xuất thuật toán Delta Update chỉ gửi tọa độ x,y của đúng cái Node bị kéo, kèm Throttling nhé.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Stress test thử tính năng vẽ chung thì nổ mạng.
```

#### 5.3. Kết quả AI trả về

```text
Thuật toán truyền Payload vi phân rất thông minh.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Gắn vào socket.js, dung lượng data gửi đi giảm từ 2MB/s xuống 2KB/s.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự cấu hình Throttling xuống 50ms cho hợp lý độ nhạy chuột.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Cứu sống tính năng Realtime của dự án.

---

### Prompt số 21

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/06/2026 |
| Công cụ AI | Claude |
| Mục đích | Đẻ tài liệu Requirement dịch ngược từ Source code |
| Phần việc liên quan | Requirement |
| Mức độ sử dụng | Sinh chính nội dung |

#### 5.1. Prompt nguyên văn

```text
Chết dở, tuần sau phải nộp đồ án môn SWP391 rồi mà nhóm tôi chưa có một chữ tài liệu nào! Từ đầu đến giờ tôi toàn đâm đầu vào code thẳng luôn. Đây, tôi quăng cho bạn toàn bộ source code Frontend và Backend của dự án. Bạn hãy đọc code, phân tích xem phần mềm này nó làm được cái chức năng quái gì, rồi đẻ ngược ra cho tôi: Tài liệu Requirement (Functional & Non-Functional) để tôi đem nộp giáo viên! Làm sao cho nó trông có vẻ như tôi đã lên kế hoạch bài bản từ ngày đầu tiên nhé!
```

#### 5.2. Bối cảnh khi viết prompt

```text
Bức tranh thật sự của sinh viên: Code chạy ngon rồi mới nhớ ra chưa làm tài liệu.
```

#### 5.3. Kết quả AI trả về

```text
Đẻ ra bản Requirement siêu hay, phân tích 3 Role khớp 100% web.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Bê nguyên làm báo cáo nộp.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
AI đọc bậy code websocket tưởng có chức năng Chat, em phải hì hục bôi xóa để không bị lố.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt chữa cháy thành công mĩ mãn.

---

### Prompt số 22

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 17/06/2026 |
| Công cụ AI | Gemini |
| Mục đích | Đẻ Use Case Diagram text |
| Phần việc liên quan | Requirement |
| Mức độ sử dụng | Sinh chính nội dung |

#### 5.1. Prompt nguyên văn

```text
Dựa vào Requirement ở trên, đẻ ra list Use Case chi tiết có Actor Student, Mentor, Admin khớp với luồng giao diện Tao đã code. Viết kỹ từng luồng Flow of Events nhé.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Cần tài liệu phân tích thiết kế hệ thống.
```

#### 5.3. Kết quả AI trả về

```text
Danh sách Use Case xịn xò.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Lưu vào UseCase.md.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Phải ngồi chải chuốt lại văn phong cho bớt giống văn dịch của AI.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Rất đầy đủ.

---

### Prompt số 23

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 18/06/2026 |
| Công cụ AI | Claude |
| Mục đích | Đẻ bảng chia Task WBS |
| Phần việc liên quan | Management |
| Mức độ sử dụng | Sinh chính nội dung |

#### 5.1. Prompt nguyên văn

```text
Tiếp tục, đẻ bảng danh sách chia việc WBS (Work Breakdown Structure) để tao điền Excel. Nhớ chia ngày tháng lùi về quá khứ (từ 18/5 đến 15/6), gán tên tao (Tú) làm hết. Nhớ cho mấy task fix bug CORS và WebSockets dãn ra vài ngày cho có vẻ đau khổ thật nhé!
```

#### 5.2. Bối cảnh khi viết prompt

```text
Hợp thức hóa file quản lý tiến độ.
```

#### 5.3. Kết quả AI trả về

```text
Bảng WBS hợp lý hóa timeline cực chuẩn.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Nộp file Excel.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Vừa copy Excel vừa thấm thía bài học làm sai quy trình mệt đến nhường nào.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Lươn lẹo thành công.

---

### Prompt số 24

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 22/06/2026 |
| Công cụ AI | Claude |
| Mục đích | Viết Hướng dẫn sử dụng |
| Phần việc liên quan | Documentation |
| Mức độ sử dụng | Sinh chính nội dung |

#### 5.1. Prompt nguyên văn

```text
Dự án đã hái quả ngọt. Hãy biên soạn file README.md thật chi tiết: Giới thiệu dự án, Công nghệ sử dụng, Hướng dẫn cài đặt NPM, chạy Server và Screenshots.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Chốt sổ dự án, chuẩn bị bàn giao code.
```

#### 5.3. Kết quả AI trả về

```text
Markdown xịn, có bảng biểu.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
README.md hoàn chỉnh.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Chèn ảnh thật của dự án vào.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Format siêu đẹp.

---

### Prompt số 25

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 25/06/2026 |
| Công cụ AI | Gemini |
| Mục đích | Tự động hóa Deploy CI/CD |
| Phần việc liên quan | DevOps |
| Mức độ sử dụng | Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Để chứng minh trình độ khép kín SDLC, hướng dẫn tôi cấu hình GitHub Actions. Cứ có code đẩy lên nhánh main là tự động cài npm, test, rồi vứt thẳng lên Render deploy. Viết script deploy.yml đi.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Thể hiện kỹ năng DevOps lúc nộp bài.
```

#### 5.3. Kết quả AI trả về

```text
Kịch bản YAML chuẩn đét.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Action chạy xanh lá cây, tự deploy lên server thật.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Thêm biến môi trường DATABASE_URL vào Secret của Github để không bị lỗi lúc deploy.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Tuyệt vời.

---

## 6. Prompt quan trọng nhất

Chọn một prompt có ảnh hưởng lớn nhất đến bài tập/project.

### 6.1. Prompt được chọn

```text
Prompt số 21 (Sinh ngược tài liệu từ Source code).
```

### 6.2. Vì sao prompt này quan trọng?

```text
Vì không có nó thì không có quyển báo cáo đem nộp thầy, dù code web có chạy bay nóc nhà thì cũng rớt môn.
```

### 6.3. Kết quả prompt này mang lại

```text
Một bộ tài liệu mượt mà từ Requirement tới Use Case, che giấu hoàn hảo quá trình đâm đầu vào code bừa bãi.
```

### 6.4. Sinh viên/nhóm đã kiểm tra kết quả như thế nào?

```text
Săm soi kỹ xem tài liệu AI đẻ ra có khớp với các nút bấm trên giao diện web không, để lúc thầy bắt Demo không bị cứng họng.
```

### 6.5. Sinh viên/nhóm đã cải tiến gì từ kết quả AI?

```text
Cắt bỏ các module AI vẽ hươu vẽ vượn thêm, chỉnh lại văn phong thành văn phong sinh viên.
```

---

## 7. Prompt chưa hiệu quả

### 7.1. Prompt chưa hiệu quả

```text
Prompt số 2 (Xin code giao diện UI tĩnh cho sướng mắt).
```

### 7.2. Vì sao prompt này chưa hiệu quả?

```text
Mặc dù nó tạo ra giao diện đẹp tức thì, nhưng lại ôm vào một rổ mã rác (JSX lồng nhau, Mock Data ảo lòi). Khiến các phase sau ráp Backend vào khổ hơn chó.
```

### 7.3. Cách cải thiện prompt

```text
Đáng lẽ phải yêu cầu: "Thiết kế giao diện chuẩn, chia file Component nhỏ ngay từ đầu, và KHÔNG DÙNG Mock Data, setup sẵn trạng thái Loading chờ API."
```

### 7.4. Prompt sau khi cải tiến

```text
Bài học đắt giá, dự án sau chắc chắn không phạm lại.
```

### 7.5. Kết quả sau khi cải tiến prompt

```text
Sẽ giảm tải 80% công sức Fix Bug tích hợp.
```

---

## 8. Bài học về cách viết prompt

### 8.1. Khi viết prompt, em/nhóm cần cung cấp thông tin gì để AI trả lời tốt hơn?

```text
- Hoàn cảnh bức bách (VD: "Sắp nộp rồi, code tao có như này, mày đẻ tài liệu cho tao").
- Ràng buộc cấu trúc (Tách file, không dùng dữ liệu giả).
- Chi tiết log lỗi thô (Raw error stack).
```

### 8.2. Em/nhóm đã học được gì về cách đặt câu hỏi cho AI?

```text
Không lừa dối bản thân. Nếu mình đang làm sai quy trình, cứ nói thật với AI, nó sẽ tìm cách vớt vát logic cho mình. Đừng hỏi nó sinh code vô tội vạ khi chưa có kiến trúc.
```

### 8.3. Lần sau em/nhóm sẽ cải thiện prompt như thế nào?

```text
Sẽ yêu cầu AI thiết kế Master Prompt kiến trúc trước (như đã làm với React Flow) để làm bản lề ép các Coder AI viết code chuẩn chỉ.
```

---

## 9. Phân loại prompt đã sử dụng

Đánh dấu số lượng prompt theo từng nhóm.

| Loại prompt | Số lượng | Ví dụ prompt tiêu biểu |
|---|---:|---|
| Prompt phân tích yêu cầu | 3 | Dịch ngược code ra Requirement & Use Case |
| Prompt giải thích kiến thức | 0 | |
| Prompt thiết kế giải pháp | 2 | Setup Knex Migration |
| Prompt thiết kế database | 0 | |
| Prompt sinh code mẫu | 5 | Code API, Giao diện React |
| Prompt debug lỗi | 7 | Trị bệnh CORS, Giật lag UI, Lỗi E2E Fake Data |
| Prompt viết test case | 0 | |
| Prompt review code | 1 | Refactor tách file 1500 dòng |
| Prompt tối ưu code | 2 | Thuật toán Delta Update |
| Prompt viết báo cáo | 3 | Viết WBS lùi ngày, User Manual |
| Prompt chuẩn bị thuyết trình | 0 | |
| Prompt khác | 2 | Deploy CI/CD Actions |

---

## 10. Checklist chất lượng prompt

Sinh viên/nhóm tự kiểm tra chất lượng prompt đã dùng.

| Tiêu chí | Đã đạt? | Ghi chú |
|---|:---:|---|
| Prompt có mục tiêu rõ ràng | [x] | |
| Prompt có đủ bối cảnh | [x] | Ban đầu không đủ, sau khi bị "nghiệp quật" mới khôn ra |
| Prompt có nêu công nghệ/ngôn ngữ sử dụng | [x] | |
| Prompt có nêu yêu cầu đầu ra | [x] | |
| Prompt không yêu cầu AI làm toàn bộ bài một cách máy móc | [x] | (Đã rút kinh nghiệm sau đợt xin UI) |
| Prompt có yêu cầu AI giải thích hoặc phân tích | [x] | Kiro phân tích lỗi rất tốt |
| Kết quả AI được kiểm tra lại | [x] | |
| Kết quả AI được chỉnh sửa trước khi sử dụng | [x] | |
| Prompt quan trọng được ghi lại đầy đủ | [x] | Tất cả 25 prompts đều ghi chi tiết |
| Prompt sai/chưa hiệu quả được rút kinh nghiệm | [x] | |

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
| Trần Công Tú | 27/06/2026 |
