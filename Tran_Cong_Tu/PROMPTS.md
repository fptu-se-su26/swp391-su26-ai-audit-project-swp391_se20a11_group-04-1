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

## 4. Danh sách các Prompt tiêu biểu

### Phase 1: Lên ý tưởng, Giao diện & Kiến trúc Database (18/05 - 28/05)

## Prompt #01
- Date: 2026-05-18
- AI Tool: Gemini
- Author: Trần Công Tú
- Purpose: Tìm kiếm thông tin và lên ý tưởng cốt lõi.

### Prompt
Đóng vai là một chuyên gia quản lý dự án phần mềm giáo dục. Hãy đề xuất các tính năng cần có cho một hệ thống "Software Project Management System" dành riêng cho sinh viên IT làm đồ án môn học. Hệ thống này có gì khác biệt so với Jira hay Trello?

### Expected Output
- Danh sách các module chính, điểm khác biệt.

### Evaluation
Gemini gợi ý tốt, chỉ ra được điểm khác biệt là tích hợp module "Đánh giá Contribution" và "Chấm điểm Mentor". Tôi lọc ra 3 module cốt lõi để làm: Task Management, Evaluation, UML Drawing.


## Prompt #02
- Date: 2026-05-19
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Phân tích và sinh Use Case cho hệ thống.

### Prompt
Dựa vào ý tưởng: Hệ thống quản lý đồ án sinh viên (Actor gồm: Student, Mentor, Admin). Chức năng cốt lõi: Quản lý nhóm, Phân chia Task, Vẽ UML, Chấm chéo (Peer-review). Hãy viết cho tôi danh sách Use Case chuẩn, và mô tả chi tiết Use Case "Create Task".

### Expected Output
- Danh sách UC theo Actor.
- Đặc tả Use Case Create Task.

### Evaluation
Claude phân tích rất sâu nhưng Use Case "Create Task" bị dư thừa bước approve của Mentor (thực tế sinh viên tự giao task). Tôi đã bỏ bước này trong file Requirement thực tế.


## Prompt #03
- Date: 2026-05-20
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Breakdown Task thành các chức năng nhỏ hơn.

### Prompt
Phân rã Use Case "Vẽ UML trên Web" thành các task lập trình chi tiết (Frontend, Backend). Yêu cầu chỉ tập trung vào chức năng vẽ Class Diagram.

### Expected Output
- WBS (Work Breakdown Structure) cho tính năng UML.

### Evaluation
Claude chia khá chuẩn, gợi ý dùng thư viện đồ họa kéo thả động. Rất hữu ích để đưa vào bảng kế hoạch.


## Prompt #04
- Date: 2026-05-22
- AI Tool: Stitch
- Author: Trần Công Tú
- Purpose: Tạo mockup UI cho trang Dashboard.

### Prompt
Tạo giao diện Dashboard cho trang quản lý dự án của sinh viên. Bao gồm: Sidebar bên trái, Header có thông tin user, main content chia làm 2 cột (Cột 1: Danh sách task cần làm, Cột 2: Biểu đồ tiến độ nhóm). Dùng TailwindCSS.

### Expected Output
- Code HTML/Tailwind cho Dashboard.

### Evaluation
Stitch gen ra khung giao diện khá đẹp, nhưng phần biểu đồ chỉ là box trống. Tôi tự chèn thư viện Chart.js vào sau đó để biểu diễn dữ liệu thật.


## Prompt #05
- Date: 2026-05-24
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Truy tìm nguyên nhân UI có vẻ chạy được nhưng thực chất là lừa dối (Mock Data).

### Prompt
Tôi vừa dùng UI do AI kia tạo. Trên màn hình hiện danh sách Task nhưng tôi thử bấm nút thêm Task mới thì danh sách không dài ra. Tại sao?

### Expected Output
- Phân tích nguyên nhân tĩnh hóa dữ liệu của file React.

### Evaluation
Kiro chỉ ra AI đã hardcode sẵn dữ liệu vào mảng (mock data) thay vì gọi fetch lên API Backend. Ngay lập tức, tôi đưa lỗi này sang Antigravity và yêu cầu nó đập đi viết lại, kết nối 100% với RESTful API thật sự để chuẩn bị cho phase sau.


## Prompt #06
- Date: 2026-05-26
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Quản lý thay đổi cấu trúc Database (DB Migration).

### Prompt
Dự án sắp bước vào giai đoạn code Backend. Tránh việc dùng lệnh `ALTER TABLE` thủ công trên PostgreSQL gây rủi ro mất data và khó đồng bộ nhóm, hãy tư vấn hệ thống quản lý Migration (như Prisma hay Knex) cho Node.js và viết script init.

### Expected Output
- Kiến trúc DB Migration chuyên nghiệp.

### Evaluation
Claude tư vấn dùng Knex Migration. Việc kiểm soát thay đổi DB bằng file code giúp tôi dễ dàng rollback nếu deploy bị lỗi. Tôi mang cấu trúc này bắt Antigravity tích hợp vào toàn dự án, chấm dứt ý định sửa DB bằng tay.


## Prompt #07
- Date: 2026-05-28
- AI Tool: Gemini
- Author: Trần Công Tú
- Purpose: Quyết định nền tảng thư viện đồ họa cốt lõi.

### Prompt
Ban đầu tôi định dùng Mermaid.js để vẽ biểu đồ UML nhưng nó quá tĩnh và không cho phép kéo thả. Có giải pháp nào khác cho React mà chuyên biệt để xây dựng Diagram tương tác thực sự không?

### Expected Output
- Đề xuất thư viện kéo thả xịn cho Module UML.

### Evaluation
Gemini đã giới thiệu tôi React Flow. Việc tôi không chấp nhận dùng một tool kém chỉ vì nó dễ làm, và chủ động research liên tục, đã giúp định hình kiến trúc đồ họa của dự án ở đẳng cấp cao hơn hẳn trước khi bắt tay vào code.


### Phase 2: Code Core Backend & Fix Bug End-to-End (29/05 - 06/06)

## Prompt #08
- Date: 2026-05-29
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Code tính năng phân quyền User.

### Prompt
Viết middleware trong ExpressJS để check Role dựa trên JWT. Có 3 role: ADMIN, MENTOR, STUDENT. Nếu route yêu cầu MENTOR mà user là STUDENT thì trả về 403.

### Expected Output
- Code đoạn `authMiddleware.js`.

### Evaluation
Antigravity viết đúng logic cơ bản, nhưng quên check case token bị expired. Tôi đã tự đọc document của `jsonwebtoken` và thêm block try-catch để handle `TokenExpiredError`.


## Prompt #09
- Date: 2026-05-30
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Tìm bug đăng nhập không lưu được token.

### Prompt
[Đưa đoạn log lỗi CORS và cookie bị reject] Frontend báo lỗi không gửi được cookie chứa token lên server dù đã login thành công. Lỗi ở đâu?

### Expected Output
- Xác định nguyên nhân lỗi CORS và SameSite cookie.

### Evaluation
Kiro dò bug rất nhanh, báo lỗi do thiếu `credentials: true` ở Axios và `SameSite=none` ở cookie.


## Prompt #10
- Date: 2026-05-31
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Fix bug CORS theo gợi ý của Kiro.

### Prompt
Cập nhật file `server.js` cấu hình lại CORS allowed origin và thêm config cookie SameSite None, Secure true như gợi ý để giải quyết lỗi.

### Expected Output
- File `server.js` được cập nhật.

### Evaluation
Antigravity fix thành công. Code đã chạy mượt.


## Prompt #11
- Date: 2026-06-02
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Code API Create Task có tính toán estimate time.

### Prompt
Viết API POST `/api/tasks`. Nhận vào `title, description, assignee_id, estimate_hours`. Logic: Validate dữ liệu, nếu `estimate_hours` > 40 thì báo lỗi "Quá thời gian cho phép của tuần". Lưu vào PostgreSQL.

### Expected Output
- Code Router, Controller, Model.

### Evaluation
Hoạt động tốt. Nhờ sự hướng dẫn, AI lưu đúng xuống PostgreSQL. Tôi đã yêu cầu Claude gen thêm schema Zod để thay thế các câu validate if-else lộn xộn ban đầu.


## Prompt #12
- Date: 2026-06-04
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Phát hiện lỗ hổng API báo 200 nhưng không lưu data vào PostgreSQL (End-to-End Testing).

### Prompt
Code API tạo Task trả về Postman 200 Success. Nhưng tôi mở PostgreSQL (pgAdmin) thì bảng Tasks không có dòng nào mới. Code này đang lừa tôi đúng không?

### Expected Output
- Phát hiện AI Coder giả mạo truy vấn.

### Evaluation
Kiro bóc mẽ rằng Antigravity chỉ `console.log` câu query SQL chứ chưa gọi hàm `pool.query()` thực thi xuống Database. Sự phát hiện E2E Testing này giúp tôi chặn đứng thói lười biếng của AI. Tôi bắt Antigravity sửa lại và nối vào CSDL lập tức.


### Phase 3: Module UML & Tương tác giao diện (07/06 - 15/06)

## Prompt #13
- Date: 2026-06-07
- AI Tool: Gemini
- Author: Trần Công Tú
- Purpose: So sánh chi tiết thư viện vẽ biểu đồ.

### Prompt
Cho tôi ưu nhược điểm của React Flow, JointJS, và GoJS trong việc xây dựng tính năng kéo thả Class Diagram. Tôi cần thư viện mã nguồn mở, dễ custom, tài liệu dễ đọc.

### Expected Output
- Bảng so sánh 3 thư viện.

### Evaluation
Gemini phân tích tốt. JointJS và GoJS thương mại nhiều, React Flow phù hợp nhất với dự án môn học. Đây là bước research cuối cùng trước khi vào code.


## Prompt #14
- Date: 2026-06-08
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Lên luồng xử lý (prompt engineering) để hướng dẫn Antigravity code UML.

### Prompt
Tôi đã chọn React Flow để làm công cụ vẽ Class Diagram. Hãy viết cho tôi một "master prompt" thật chi tiết (bao gồm cấu trúc Node, cách nối Edge, cách quản lý state) để tôi đưa cho trợ lý code của tôi thực hiện.

### Expected Output
- Một đoạn Prompt chi tiết mô tả logic cần implement.

### Evaluation
Claude tạo ra prompt rất kỹ, mô tả rõ cấu trúc data của React Flow. Việc này giúp tôi kiểm soát hoàn toàn thiết kế hệ thống trước khi bắt đầu code.


## Prompt #15
- Date: 2026-06-09
- AI Tool: Stitch
- Author: Trần Công Tú
- Purpose: Tạo giao diện Toolpad chứa các hình khối UML.

### Prompt
Tạo component Toolbar nằm ngang bên trái màn hình. Có 3 nút có thể kéo thả (Draggable): "Class", "Interface", "Enum". Dùng TailwindCSS.

### Expected Output
- Component `Sidebar.tsx`.

### Evaluation
Giao diện đẹp. Tuy nhiên thuộc tính kéo thả (HTML5 Drag Drop) Stitch gen bị thiếu hàm `onDragStart`, tôi yêu cầu AI bổ sung lại logic sự kiện này.


## Prompt #16
- Date: 2026-06-11
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Implement logic React Flow.

### Prompt
Dựa trên yêu cầu sau: [Paste Master Prompt từ Claude]. Hãy code component `UmlDiagram.jsx` nhận drag event từ Sidebar và thêm Node mới vào sơ đồ.

### Expected Output
- React component xử lý diagram.

### Evaluation
Antigravity code ra nhưng logic liên kết (Edge) bị lỗi, không dính vào các thẻ (Handle) của Node. Tôi nhận ra AI không hiểu rõ cấu trúc Custom Node của mình.


## Prompt #17
- Date: 2026-06-12
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Tìm bug tại sao Edge không nối được vào Node.

### Prompt
[Đưa file CustomNode.jsx và log lỗi React Flow] Tại sao khi tôi kéo thả dây nối, nó không lưu thành Edge trong state `edges`? Kéo xong thả tay ra là dây biến mất.

### Expected Output
- Phân tích bug.

### Evaluation
Kiro phát hiện ra ID của Handle trong CustomNode không trùng khớp với ID khi hàm `onConnect` bắn ra. Do AI gen code ở file A khác chuẩn với file B.


## Prompt #18
- Date: 2026-06-13
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Fix logic onConnect của React Flow.

### Prompt
Thay vì dùng cách cũ, hãy viết lại hàm `onConnect` sử dụng `addEdge` của React Flow. Hãy truyền đúng ID 'top-handle' và 'bottom-handle' mà tôi đã fix.

### Expected Output
- Fix bug nối mép UML.

### Evaluation
Thành công. Tôi nhận ra nếu không tự check code và đồng bộ ID giữa các file thì AI sẽ cứ tự ảo giác và sinh ra logic sai lệch.


## Prompt #19
- Date: 2026-06-14
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Tìm lỗi State management (Undo/Redo).

### Prompt
Logic Undo/Redo của tôi (lưu mảng history) đang làm web bị lag khi số node lên đến 50. Tại sao? [Đưa file useUndoRedo.js]

### Expected Output
- Nguyên nhân hiệu năng kém.

### Evaluation
Kiro báo lỗi do lưu cả Object quá to vào state thay vì chỉ lưu Delta (sự thay đổi). 


## Prompt #20
- Date: 2026-06-15
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Tối ưu hoá Undo/Redo.

### Prompt
Tôi không muốn lưu nguyên mảng Nodes/Edges nữa. Hãy viết một custom hook dùng Lodash `debounce` và chỉ lưu các ID bị thay đổi. 

### Expected Output
- Code tối ưu hóa (Refactor).

### Evaluation
Antigravity viết ban đầu khá phức tạp. Thay vì tự code tay, tôi mang code rườm rà đó ném sang cho Claude để nhờ nó phân tích và tối ưu hóa cho sạch sẽ hơn. Sau khi Claude đưa ra bản rút gọn dễ hiểu, tôi yêu cầu Antigravity implement lại. Sự kết hợp chéo này giúp hệ thống vừa mượt vừa clear code.


### Phase 4: Bảo mật, Tối ưu hóa hệ thống & DevOps (16/06 - 27/06)

## Prompt #21
- Date: 2026-06-18
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Xử lý lỗi Crash UI khi đụng độ khóa Optimistic Locking.

### Prompt
Nhờ tôi cấu hình Optimistic Locking từ trước, khi 2 user cùng thao tác, DB đã chặn được (báo version conflict). Nhưng Frontend React của tôi bị văng màn hình trắng bóc thay vì hiện thông báo lỗi. Làm sao bắt lỗi này và hiển thị popup cảnh báo mượt mà?

### Expected Output
- Giải pháp Error Boundary & Graceful Degradation.

### Evaluation
Kiro tìm ra lỗi do Frontend thiếu cơ chế Error Boundary bọc quanh Component. Tôi nhờ Claude thiết kế lại UI/UX popup báo lỗi, rồi ép Antigravity code `ErrorBoundary`. Sự kết hợp hoàn hảo bảo vệ hệ thống từ sâu thẳm DB lên tới trải nghiệm UX bề mặt.


## Prompt #22
- Date: 2026-06-20
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Tái cấu trúc "nợ kỹ thuật" (Refactoring Technical Debt).

### Prompt
Antigravity vừa code ra file `UmlDiagram.jsx` dài tận 1500 dòng chứa tả pín lù (gọi API, socket, kéo thả, logic). Hãy áp dụng nguyên tắc Separation of Concerns, vạch ra kiến trúc chia file này thành các Custom Hooks (`useUmlState`, `useSocket`) và các component nhỏ gọn.

### Expected Output
- Cấu trúc thư mục Component và Hook rõ ràng.

### Evaluation
Claude băm nhỏ file 1500 dòng thành 5 file nhỏ gọn, mỗi file không quá 200 dòng. Tôi đưa bản vẽ kiến trúc này ép Antigravity đập code cũ ra và chia lại. 


## Prompt #23
- Date: 2026-06-22
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Tối ưu WebSockets bị lag khi sử dụng chung (Concurrency).

### Prompt
Tính năng 5 người cùng vẽ sơ đồ UML bằng WebSockets đang làm sập trình duyệt do AI gửi data mảng Nodes liên tục mỗi khung hình. Có thuật toán tối ưu nào để gửi data nhẹ hơn không?

### Expected Output
- Thuật toán tối ưu đường truyền (Network).

### Evaluation
Claude hướng dẫn tôi kỹ thuật "Delta Update" (chỉ gửi tọa độ nhỏ lẻ của điểm bị thay đổi) kết hợp Throttle. Tôi hiểu được logic này và ra lệnh cho Antigravity làm theo. Nhờ đó, 20 người vô cùng lúc web vẫn chạy êm ru.


## Prompt #24
- Date: 2026-06-25
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Viết User Manual (Tài liệu hướng dẫn sử dụng).

### Prompt
Dựa trên Use Case ban đầu và các tính năng: Đăng nhập, Tạo Task, Vẽ UML trực tuyến. Hãy viết một file README.md thật chuyên nghiệp hướng dẫn sinh viên (End-user) cách sử dụng hệ thống này.

### Expected Output
- File README.md hoàn chỉnh.

### Evaluation
Claude viết document cực tốt, chuyên nghiệp và có mục lục rõ ràng. Tôi chỉ việc bổ sung thêm ảnh chụp màn hình (screenshot) của app.


## Prompt #25
- Date: 2026-06-27
- AI Tool: Gemini
- Author: Trần Công Tú
- Purpose: Thiết lập CI/CD Pipeline tự động hóa DevOps.

### Prompt
Đóng vai một DevOps Engineer. Chỉ tôi cách tự động hóa quy trình: Cứ mỗi khi tôi push code lên nhánh `main` của GitHub, hệ thống tự động chạy Unit Test, nếu Pass thì tự động deploy lên server Render. Yêu cầu viết file `.github/workflows/deploy.yml`.

### Expected Output
- Script GitHub Actions CI/CD chuẩn mực.

### Evaluation
Gemini gen ra file `deploy.yml` khá chuẩn. Tuy nhiên lúc chạy trên GitHub Action bị lỗi thiếu biến môi trường DB URL. Tôi lại dùng Kiro để trace log của Actions, fix env và luồng deploy tự động đã chạy thành công rực rỡ.
