# AI Audit Log

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
| Ngày hoàn thành | 27/06/2026 |

---

## 2. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [ ] ChatGPT
- [x] Gemini
- [x] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Perplexity
- [ ] Microsoft Copilot
- [x] Công cụ khác: Stitch, Kiro

---

## 3. Mục tiêu sử dụng AI

Mô tả ngắn gọn sinh viên/nhóm đã sử dụng AI để hỗ trợ những công việc nào.

### Mô tả mục tiêu sử dụng AI

```text
- Xin code UI tĩnh (HTML/React/Tailwind) cho xịn xò để có động lực làm đồ án.
- Viết bộ API CRUD Backend (Nodejs, PostgreSQL) để gắn vào cục UI trên.
- Đọc log, trị bệnh và fix các lỗi ngáo ngơ khi ghép Frontend với Backend (như CORS, Fake Data E2E).
- Tối ưu hóa hiệu năng giật lag do AI code ẩu (Memory Leak, WebSockets spam).
- (Quan trọng nhất): Quăng cục code đã hoàn thành cho AI phân tích để viết ngược lại tài liệu Requirement, Use Case, Task nộp giáo viên vì ban đầu lười không làm quy trình chuẩn.
```

---

## 4. Nhật ký sử dụng AI chi tiết

> Dưới đây là 7 cột mốc quan trọng sử dụng AI phản ánh đúng quy trình phát triển "ngược" thực tế của đồ án: Code UI -> Code API -> Ghép nổ bug -> Fix bug -> Tối ưu -> Gen ngược Tài liệu.

---

### Lần sử dụng AI số 1: Xin giao diện bất chấp hậu quả

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 19/05/2026 |
| Công cụ AI | Stitch |
| Mục đích sử dụng | Xin code Giao diện UI tĩnh cho sướng mắt |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
Tôi đang cần thiết kế giao diện cho trang Dashboard quản lý dự án. Yêu cầu giao diện sáng sủa, hiện đại dùng TailwindCSS. Có Sidebar bên trái, Header, và danh sách Task. Cứ đập dữ liệu giả (Mock data) vào cho tôi xem nó hiện lên thế nào đã.
```

#### 4.2. Kết quả AI gợi ý

```text
Stitch sinh ra một cụm Component cực kỳ lộng lẫy, màu sắc phối chuẩn UI/UX hiện đại, bên trong nhồi nhét sẵn mảng `mockTasks = [...]` để render ra giao diện.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Bê nguyên xi file `Dashboard.tsx` 1500 dòng vứt vào thư mục dự án và chạy lên khoe với nhóm.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Nhận ra giao diện AI cho thì đẹp thật, nhưng code JSX cực kỳ rác và rối rắm.
- Bắt đầu phải tự thân vận động bóc tách thành các component nhỏ hơn để sau này nhét API vào cho dễ.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Add initial static UI dashboard |
| File liên quan | Dashboard.tsx |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Thói quen "thích đẹp trước, tính năng tính sau" của sinh viên được AI đáp ứng quá tốt. Nhưng nó che giấu đi sự thật là code rỗng tuếch (Mock Data). Tự lừa mình dối người!
```

---

### Lần sử dụng AI số 2: Viết CRUD Backend siêu tốc

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/05/2026 |
| Công cụ AI | Antigravity |
| Mục đích sử dụng | Sinh code CRUD API Backend |
| Phần việc liên quan | Backend / Database |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
Ok, tôi đã có giao diện rồi. Giờ tôi cần API POST /api/tasks để tạo công việc mới. Input nhận vào từ body sẽ bao gồm title, description, assignee_id, và estimate_hours. Logic nghiệp vụ yêu cầu phải validate dữ liệu bằng thư viện Zod. Sau đó lưu xuống PostgreSQL. 
```

#### 4.2. Kết quả AI gợi ý

```text
Antigravity tuôn ra một loạt file controller và định nghĩa Zod schema siêu tốc.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Khung sườn API CRUD và luồng Route.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- AI không chịu kiểm tra kỹ nghiệp vụ, chỉ if-else đơn giản. Em phải ép nó cấu hình chuẩn hóa Zod để bắt các logic sâu hơn (như text không được quá dài).
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Add Backend CRUD API for Tasks |
| File liên quan | task.controller.js |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Code AI viết ra để "chạy được" thì rất dễ, nhưng để an toàn thì cần sự giám sát của DEV.
```

---

### Lần sử dụng AI số 3: E2E Testing vạch trần AI giả mạo

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/05/2026 |
| Công cụ AI | Kiro |
| Mục đích sử dụng | Dò lỗi API Postman báo xanh nhưng DB trống trơn |
| Phần việc liên quan | Debug E2E |
| Mức độ sử dụng | Hỏi debug |

#### 4.1. Prompt đã sử dụng

```text
Tôi test thử API tạo Task bằng Postman báo 200 Success. Tuy nhiên khi tôi mở pgAdmin thì bảng Tasks trống trơn. Đoạn code controller này đang có vấn đề gì? Có phải nó chỉ in console.log mà không lưu DB?
```

#### 4.2. Kết quả AI gợi ý

```text
Kiro chỉ ra Antigravity chỉ in câu query ra console thay vì gọi `pool.query` lưu thật xuống Database.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Bắt lỗi lười biếng của Coder AI.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Tự tay bổ sung luồng `await pool.query` vật lý xuống DB. Bài học đắt giá về việc không bao giờ tin tưởng mù quáng vào status 200 của AI.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Fix fake API save to DB |
| File liên quan | task.controller.js |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Sinh viên rất dễ bị AI lừa bằng những đoạn code vỏ bọc. Phải kiểm tra End-to-End từ giao diện tới tận dưới đáy Database.
```

---

### Lần sử dụng AI số 4: Ác mộng tích hợp CORS

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 26/05/2026 |
| Công cụ AI | Kiro |
| Mục đích sử dụng | Cứu vớt giao diện khi ghép API bị chặn |
| Phần việc liên quan | Integration |
| Mức độ sử dụng | Hỏi giải pháp |

#### 4.1. Prompt đã sử dụng

```text
Đang gặp lỗi CORS! Đăng nhập thành công, server trả Cookie JWT đàng hoàng nhưng mấy API sau Frontend gọi lên bị trình duyệt chặn đỏ lòm, không gửi kèm Cookie. SameSite có liên quan gì không?
```

#### 4.2. Kết quả AI gợi ý

```text
Giải thích cơ chế bảo mật trình duyệt, yêu cầu bật `credentials: true` trên Axios và CORS.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Áp dụng cấu hình CORS vào Express Backend.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Chuyển IP Frontend thành biến môi trường `.env` thay vì hardcode để tránh lặp lại lỗi này khi đưa lên server thực tế (Deploy).
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Fix CORS and credentials header |
| File liên quan | server.js |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Kiến thức mạng (Networking) và bảo mật trình duyệt cực kỳ quan trọng, AI không thể tự xử lý nết developer không nắm gốc.
```

---

### Lần sử dụng AI số 5: Trị bệnh Giật Lag do AI "clone" dữ liệu

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 05/06/2026 |
| Công cụ AI | Kiro & Antigravity |
| Mục đích sử dụng | Chữa bệnh tụt FPS khi Undo/Redo sơ đồ UML |
| Phần việc liên quan | Optimize |
| Mức độ sử dụng | Hỗ trợ tìm lỗi và cấu trúc thuật toán |

#### 4.1. Prompt đã sử dụng

```text
Web giật tung chảo! Cứ mỗi lần kéo 1 Node lệch 1 pixel là đơ mất 1 giây. Đây là code useUndoRedo.js, có phải do việc lưu clone toàn bộ mảng State hàng ngàn Node mỗi giây gây tràn RAM không? Hãy dùng Lodash debounce để gom thao tác và Delta update!
```

#### 4.2. Kết quả AI gợi ý

```text
Phát hiện AI trước đó dùng `JSON.parse(JSON.stringify(array))` vô tội vạ. AI mới đưa ra thuật toán "Debounce" (200ms mới lưu) và "Delta" (chỉ lưu cục bộ thay đổi).
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Đập bỏ toàn bộ code cũ, lấy Hook `useUndoRedo` cực mượt của AI mới.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Tự căn chỉnh thời gian debounce xuống 200ms sao cho cảm giác kéo chuột chân thực nhất.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Optimize Undo/Redo performance memory leak |
| File liên quan | useUndoRedo.js |

#### 4.6. Nhận xét cá nhân/nhóm

```text
AI thường chọn con đường "dễ nhất" để code chạy được (deep clone), bỏ mặc hậu quả hiệu năng. Lúc web lag mới thấy giá trị của Developer xịn.
```

---

### Lần sử dụng AI số 6: Vỡ giao diện vì Database Optimistic Locking

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 10/06/2026 |
| Công cụ AI | Kiro |
| Mục đích sử dụng | Bắt lỗi Crash UI (Màn hình trắng) |
| Phần việc liên quan | Error Handling |
| Mức độ sử dụng | Xin giải pháp |

#### 4.1. Prompt đã sử dụng

```text
Nhờ cái Optimistic Locking, CSDL đã chặn được lỗi 2 người sửa chung 1 Task. Nhưng mà Frontend văng mẹ màn hình trắng xóa bực cả mình vì không đỡ được Exception đó. Hướng dẫn tôi bọc Error Boundary trong React để bắt lỗi này.
```

#### 4.2. Kết quả AI gợi ý

```text
Cung cấp class component ErrorBoundary chuẩn để hứng lỗi React component tree.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Bọc toàn bộ App trong thẻ ErrorBoundary.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Trang trí CSS lại cho màn hình Lỗi hiển thị đẹp mắt và chuyên nghiệp hơn, thay vì giao diện thô ráp mặc định của AI.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Wrap UI with Error Boundary |
| File liên quan | ErrorBoundary.jsx |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Xử lý lỗi từ DB ném lên Frontend phải thanh lịch, không thể để web sập văng màn trắng.
```

---

### Lần sử dụng AI số 7: Dịch ngược Tài liệu nộp thầy phút 89

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/06/2026 |
| Công cụ AI | Claude |
| Mục đích sử dụng | Gen "ngược" tài liệu nộp thầy từ code đã chạy |
| Phần việc liên quan | Requirement / Report |
| Mức độ sử dụng | Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
Chết dở, tuần sau phải nộp đồ án môn SWP391 rồi mà nhóm tôi chưa có một chữ tài liệu nào! Từ đầu đến giờ tôi toàn đâm đầu vào code thẳng luôn. Đây, tôi quăng cho bạn toàn bộ source code Frontend và Backend của dự án. Bạn hãy đọc code, phân tích xem phần mềm này nó làm được cái chức năng quái gì, rồi đẻ ngược ra cho tôi: Tài liệu Requirement (Functional & Non-Functional), Danh sách Use Cases, và Phân rã Task (WBS) để tôi nhét vào báo cáo đem nộp giáo viên! Làm sao cho nó trông có vẻ như tôi đã lên kế hoạch bài bản từ ngày đầu tiên nhé!
```

#### 4.2. Kết quả AI gợi ý

```text
Claude đọc mớ code hỗn độn, xuất sắc bóc tách ra được 3 Actor (Admin, Mentor, Student), đẻ ra list Use Case khớp 100% với giao diện đã code.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
- Góp nhặt toàn bộ mớ tài liệu Requirement, Use Case, và WBS do AI gen ra để làm báo cáo đồ án.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
- Phải ngồi hì hục sửa lại ngày tháng trong file Excel WBS cho nó "hợp lý hóa" (lùi ngày thiết kế về tháng 5, ngày code sang tháng 6) để không bị giảng viên phát hiện quy trình làm việc ngược đời.
- Cắt bỏ những Use Case AI chém gió thêm (do AI đọc code thấy hàm thừa).
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | Gen docs from source code |
| File liên quan | docs/Requirement.md, docs/UseCase.md |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Mánh khóe "Reverse Engineering Document" sinh viên nào cũng xài. Mặc dù AI cứu mạng phút chót, nhưng em nhận ra nếu có tài liệu từ đầu thì lúc code đã không bị rối và đập đi xây lại nhiều như thế. Một bài học xương máu về SDLC!
```

---

## 5. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu |  |  |  | X | Cuối môn mới lôi AI ra đẻ Requirement |
| Viết user story/use case |  |  |  | X | AI đọc code gen ra |
| Thiết kế database |  |  | X |  | Xin AI file Migration |
| Thiết kế kiến trúc hệ thống |  | X |  |  | Không có kiến trúc, mạnh đâu code đó |
| Thiết kế giao diện |  |  |  | X | Sinh UI tĩnh (Mock Data) ngay ngày 1 |
| Code frontend |  |  | X |  |  |
| Code backend |  |  | X |  |  |
| Debug lỗi |  |  | X |  | Cứu tinh trong các lỗi CORS, Giật lag, Trắng UI |
| Viết test case | X |  |  |  | Không thèm viết test case |
| Kiểm thử sản phẩm | X |  |  |  | Bấm bằng tay trên trình duyệt E2E |
| Tối ưu code |  |  | X |  | Tối ưu Delta Update và Debounce |
| Viết báo cáo |  |  | X |  | Format báo cáo cực nhanh |
| Làm slide thuyết trình | X |  |  |  |  |

---

## 6. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | Cho code giao diện nhưng gắn đống dữ liệu ảo mảng tĩnh | Bấm nút Thêm/Xóa không thấy xi nhê | Ngồi bóc tay từng dòng mock data để gắn Axios API |
| 2 | Code API báo 200 nhưng lười không lưu thật xuống DB | Test End-to-End check DB Postgres | Ép AI bổ sung `pool.query` |
| 3 | AI code mảng bự làm sập RAM | Kéo thả UML thấy giật lag 2s | Ép AI đổi sang Lodash Debounce |
| 4 | Sinh tài liệu quá đà so với code thực tế | Đọc lại Requirement thấy có module Chat dù mình chưa code | Xóa bớt để nộp thầy không bị hỏi vặn |

---

## 7. Kiểm chứng kết quả AI

### Nội dung kiểm chứng

```text
- Lúc test app (E2E Testing): Luôn luôn phải mở Postman và pgAdmin 1 lúc để dò xem data có chui xuống tận đáy CSDL hay không. Tránh bị AI ru ngủ bằng Console.log.
- Lúc nộp tài liệu: Ngồi đối chiếu chéo (Cross-check) từng dòng Use Case AI đẻ ra xem có cái nút bấm nào trên UI tương ứng không, tránh râu ông nọ cắm cằm bà kia.
```

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

```text
Mặc dù dùng AI đẻ ra cả đống code và tài liệu, nhưng thành quả mồ hôi nước mắt của em nằm ở khâu "Ghép nối và Dọn Rác". 
Khi UI và API đứng riêng thì chạy rất ngon, lúc ráp vào thì CORS văng tung tóe, Mock data cứng ngắc, giật lag liên tục. Em là người cầm trịch gỡ từng cục sạn đó, quyết định đập bỏ luồng logic rườm rà của AI để viết lại các hàm React tinh gọn hơn. Cuối cùng, việc luồn lách "đẻ" tài liệu cho khớp logic code cũng là một nghệ thuật thấu hiểu hệ thống!
```

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
Nó bơm cho em liều dopamine cực mạnh ở ngày đầu dự án khi đẻ ra cái giao diện đẹp lung linh. Giúp em code trâu bò hàng đống API tẻ nhạt, và đóng vai trò "cứu giá" gen tài liệu đối phó phút 89.
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
Không dùng thuật toán quản lý mảng History khổng lồ của nó vì làm đứng máy. Không lấy mấy chức năng nó bịa thêm trong bản Requirement vì không đủ sức bảo vệ trước hội đồng bảo vệ.
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
Luôn Double check: Test trên trình duyệt + Test trên CSDL PostgreSQL. Đọc tài liệu AI gen ra rồi lấy thước so với giao diện thực tế.
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Khó nhất là phải ngồi viết bộ tài liệu Requirement và Use Case dập khuôn dài dòng. Và tất nhiên là không thể tự code cái giao diện React Tailwind đẹp vậy trong 1 ngày được.
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
Môn SWP391 dạy về quy trình làm phần mềm. Dù em làm ngược quy trình (Code -> Debug -> Gen Docs), nhưng chính vì đau khổ lúc fix bug tích hợp, em mới ngộ ra giá trị của việc thiết kế kiến trúc và viết requirement đàng hoàng từ đầu. Lần sau đi làm thật tuyệt đối không chơi trò đâm đầu vào code nữa.
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
Trách nhiệm là mình nộp báo cáo láo thì mình phải tự biết nhục nếu thầy hỏi không trả lời được. Do đó, dù AI sinh ra báo cáo phút chót, em phải ngồi cày cuốc học thuộc lòng từng Use Case, hiểu rõ từng luồng logic mình đã code để bảo vệ đồ án như một người kỹ sư chân chính.
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
| Trần Công Tú | 27/06/2026 |
