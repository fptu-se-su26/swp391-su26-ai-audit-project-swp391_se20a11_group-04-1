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

- (Gemini) Tìm kiếm thông tin và lên ý tưởng (Brainstorming). So sánh đánh giá các thư viện.
- (Claude) Phân tích Requirement, phân rã Use Case, lên ý tưởng kiến trúc hệ thống và viết Document.
- (Stitch) Gợi ý và tạo giao diện cơ bản (UI/UX Mockup).
- (Antigravity) Hỗ trợ viết các block code logic, fix bug và refactor code.
- (Kiro) Hỗ trợ dò tìm bug, phân tích lỗi (bug tracing) và giải thích log server.

---

## 4. Chi tiết sử dụng AI (Audit Log)

### Phase 1: Lên ý tưởng, Giao diện & Kiến trúc Database (18/05 - 28/05)

## Log #01
- Date: 2026-05-18
- Author: Trần Công Tú
- AI Tool: Gemini
- Purpose: Brainstorming tính năng hệ thống quản lý dự án cho sinh viên.
- Prompt Reference: PROMPTS.md#prompt-01
- AI Output Summary: Gợi ý các module Task, Đánh giá chéo, Nhắn tin, Vẽ UML.
- Human Decision: Chỉ chọn module Task, UML và Đánh giá, bỏ qua nhắn tin để tập trung chuyên môn.
- Applied To: Ý tưởng đề tài.
- Verification: Phê duyệt từ GVHD.

## Log #02
- Date: 2026-05-19
- Author: Trần Công Tú
- AI Tool: Claude
- Purpose: Sinh Use Case document từ tính năng cốt lõi.
- Prompt Reference: PROMPTS.md#prompt-02
- AI Output Summary: Danh sách Use Case Actor Student/Mentor, đặc tả Create Task.
- Human Decision: Lược bỏ bước "Approve Task" dư thừa của AI vì đồ án sinh viên cần flow nhanh gọn.
- Applied To: File Requirement.docx.
- Verification: Đọc chéo lại và đối chiếu với nghiệp vụ thực tế của lớp SWP391.

## Log #03
- Date: 2026-05-20
- Author: Trần Công Tú
- AI Tool: Claude
- Purpose: Lập Work Breakdown Structure (WBS) cho chức năng UML.
- Prompt Reference: PROMPTS.md#prompt-03
- AI Output Summary: Các task Frontend/Backend chi tiết để xử lý bản vẽ.
- Human Decision: Chia lại task cho phù hợp với khả năng của team.
- Applied To: Trello Board của nhóm.
- Verification: Nhóm đã review và đồng ý với WBS.

## Log #04
- Date: 2026-05-22
- Author: Trần Công Tú
- AI Tool: Stitch
- Purpose: Gen UI Mockup trang Dashboard.
- Prompt Reference: PROMPTS.md#prompt-04
- AI Output Summary: Layout lưới TailwindCSS.
- Human Decision: AI làm phần chart rất tệ, tôi quyết định xóa chart AI gen và tự gắn thư viện Chart.js vào.
- Applied To: Frontend (`Dashboard.tsx`).
- Verification: Test giao diện Responsive thành công trên màn hình Chrome.

## Log #05
- Date: 2026-05-24
- Author: Trần Công Tú
- AI Tool: Kiro
- Purpose: Phá vỡ "Mock Data" (Dữ liệu tĩnh) của Frontend.
- Prompt Reference: PROMPTS.md#prompt-05
- AI Output Summary: Dò ra được Frontend không hề call API mà đọc từ một mảng Array cứng (Mock array).
- Human Decision: Cương quyết không dùng code nửa vời. Bắt Coder AI xóa ngay mảng mock và viết fetch/axios gọi lên hệ thống thực.
- Applied To: End-to-End System Integration.
- Verification: Giao diện sau khi fetch hoàn toàn trống vì DB chưa có, nhưng như thế mới là phản ánh thực tế để đi build Backend tiếp.

## Log #06
- Date: 2026-05-26
- Author: Trần Công Tú
- AI Tool: Claude
- Purpose: Setup Database Migration.
- Prompt Reference: PROMPTS.md#prompt-06
- AI Output Summary: Khuyên dùng Knex Migration thay cho sửa DB bằng tay.
- Human Decision: Hiểu rõ rủi ro bảo trì DB thủ công, tôi bắt Antigravity tích hợp luồng Migration này vào source code từ sớm.
- Applied To: Quản lý vòng đời cấu trúc Database.
- Verification: Run script `migrate:up` tạo bảng comment thành công mà không chạm tay vào pgAdmin.

## Log #07
- Date: 2026-05-28
- Author: Trần Công Tú
- AI Tool: Gemini
- Purpose: Thay đổi nền tảng biểu đồ từ sớm vì cái cũ quá yếu.
- Prompt Reference: PROMPTS.md#prompt-07
- AI Output Summary: Chuyển hướng từ công cụ tĩnh Mermaid.js sang công cụ tương tác React Flow.
- Human Decision: Sẵn sàng nghiên cứu nền tảng mới vì em muốn sản phẩm phải xịn nhất, kéo thả được thực sự.
- Applied To: Tech Stack Architecture.
- Verification: Trải nghiệm thử React Flow trên máy, đạt kỳ vọng cực tốt.


### Phase 2: Code Core Backend & Fix Bug End-to-End (29/05 - 06/06)

## Log #08
- Date: 2026-05-29
- Author: Trần Công Tú
- AI Tool: Antigravity
- Purpose: Viết Auth Middleware phân quyền người dùng.
- Prompt Reference: PROMPTS.md#prompt-08
- AI Output Summary: Code express middleware check role.
- Human Decision: AI thiếu check JWT expired, tôi tự bổ sung đoạn catch error của thư viện jsonwebtoken.
- Applied To: Backend (`auth.middleware.js`).
- Verification: Dùng Postman test API bằng token hết hạn và check mã 401/403 chuẩn xác.

## Log #09
- Date: 2026-05-30
- Author: Trần Công Tú
- AI Tool: Kiro
- Purpose: Tìm lỗi gửi cookie chứa token bị failed.
- Prompt Reference: PROMPTS.md#prompt-09
- AI Output Summary: Báo lỗi SameSite cookie và cấu hình CORS Axios.
- Human Decision: Hiểu được bản chất bảo mật CORS, lên kế hoạch cấu hình lại cả FE và BE.
- Applied To: N/A (chỉ là phân tích lỗi).
- Verification: Đọc lại Document của MDN Web Docs để chứng thực Kiro nói đúng.

## Log #10
- Date: 2026-05-31
- Author: Trần Công Tú
- AI Tool: Antigravity
- Purpose: Áp dụng config fix lỗi CORS.
- Prompt Reference: PROMPTS.md#prompt-10
- AI Output Summary: Update server.js thêm cấu hình cors credential.
- Human Decision: Review đoạn code AI gen xem có an toàn không, chuyển domain config thành biến môi trường .env.
- Applied To: Backend (`server.js`).
- Verification: Login FE gọi API thành công, cookie được attach.

## Log #11
- Date: 2026-06-02
- Author: Trần Công Tú
- AI Tool: Antigravity
- Purpose: Code API Create Task với logic validation.
- Prompt Reference: PROMPTS.md#prompt-11
- AI Output Summary: Controller hàm create task.
- Human Decision: Nhận thấy AI code if-else lộn xộn, tôi nhờ Claude gen schema Zod thay thế. Giám sát để AI lưu chính xác xuống PostgreSQL.
- Applied To: Backend (`task.controller.js`).
- Verification: Test các case fail/pass bằng Postman.

## Log #12
- Date: 2026-06-04
- Author: Trần Công Tú
- AI Tool: Kiro
- Purpose: Debug lỗi lừa dối của API Backend đối với PostgreSQL.
- Prompt Reference: PROMPTS.md#prompt-12
- AI Output Summary: Lòi ra việc Antigravity chỉ in query SQL ra Console thay vì thực thi kết nối xuống DB.
- Human Decision: Nhận thức sự nguy hiểm nếu không test chéo E2E. Em ép AI phải sửa lại lệnh gọi pool.query đàng hoàng.
- Applied To: Backend DB Connection.
- Verification: Sau khi sửa, dữ liệu đã lưu cứng vào PostgreSQL.


### Phase 3: Module UML & Tương tác giao diện (07/06 - 15/06)

## Log #13
- Date: 2026-06-07
- Author: Trần Công Tú
- AI Tool: Gemini
- Purpose: So sánh thư viện UML vẽ biểu đồ trên React.
- Prompt Reference: PROMPTS.md#prompt-13
- AI Output Summary: Bảng so sánh React Flow, JointJS, GoJS.
- Human Decision: Dựa vào phân tích, tôi quyết định chọn React Flow vì nó opensource và tài liệu dễ dùng nhất.
- Applied To: Quyết định kỹ thuật (Tech stack).
- Verification: Kiểm tra thực tế NPM packages và github star của thư viện.

## Log #14
- Date: 2026-06-08
- Author: Trần Công Tú
- AI Tool: Claude
- Purpose: Phân tích kiến trúc implementation cho UML.
- Prompt Reference: PROMPTS.md#prompt-14
- AI Output Summary: Master prompt về logic Node, Edge.
- Human Decision: Dùng prompt này làm kim chỉ nam để ra lệnh cho Antigravity code các phase nhỏ.
- Applied To: Tài liệu Thiết kế kiến trúc.
- Verification: Đọc kỹ tài liệu của React Flow để xác nhận kiến trúc Claude đề xuất là khả thi.

## Log #15
- Date: 2026-06-09
- Author: Trần Công Tú
- AI Tool: Stitch
- Purpose: Tạo component Sidebar cho UML Tools.
- Prompt Reference: PROMPTS.md#prompt-15
- AI Output Summary: Thanh menu chứa các nút công cụ Class, Enum.
- Human Decision: AI thiếu API HTML5 Drag Drop, tôi yêu cầu Antigravity tự code thêm draggable và onDragStart.
- Applied To: Frontend (`UmlSidebar.tsx`).
- Verification: Test thao tác kéo thả trên trình duyệt, log event thành công.

## Log #16
- Date: 2026-06-11
- Author: Trần Công Tú
- AI Tool: Antigravity
- Purpose: Code core feature React Flow diagram.
- Prompt Reference: PROMPTS.md#prompt-16
- AI Output Summary: Render ra khung React Flow, kéo thả node.
- Human Decision: AI code sai phần map Handle, tôi nhận ra AI đang bị "ảo giác" do không hiểu custom code của tôi.
- Applied To: Frontend (`UmlDiagram.tsx`).
- Verification: Test nối mép giữa 2 khối class thất bại. Quyết định tìm bug.

## Log #17
- Date: 2026-06-12
- Author: Trần Công Tú
- AI Tool: Kiro
- Purpose: Debug lỗi React Flow không dính Edge.
- Prompt Reference: PROMPTS.md#prompt-17
- AI Output Summary: Kiro phân tích ra Handle ID không match (file này dùng 'a' file kia dùng 'top').
- Human Decision: Đồng nhất lại naming convention (cách đặt tên) cho toàn bộ project để tránh lỗi tương tự.
- Applied To: Frontend (Toàn bộ component liên quan React Flow).
- Verification: N/A.

## Log #18
- Date: 2026-06-13
- Author: Trần Công Tú
- AI Tool: Antigravity
- Purpose: Rewrite logic onConnect chuẩn xác.
- Prompt Reference: PROMPTS.md#prompt-18
- AI Output Summary: Viết lại đoạn hook React Flow onConnect.
- Human Decision: AI làm đúng yêu cầu sau khi tôi ép cụ thể param Handle ID.
- Applied To: Frontend (`UmlDiagram.tsx`).
- Verification: Thao tác vẽ đường dây (Edge) dính kết thành công, giữ dây khi kéo block.

## Log #19
- Date: 2026-06-14
- Author: Trần Công Tú
- AI Tool: Kiro
- Purpose: Profiling lỗi giật lag web khi số lượng diagram lớn.
- Prompt Reference: PROMPTS.md#prompt-19
- AI Output Summary: Kiro chỉ ra state bị render liên tục mỗi khi Undo/Redo vì clone mảng object bự.
- Human Decision: Quyết định phải refactor logic Undo/Redo bằng cách debouncing.
- Applied To: Tối ưu hoá (Optimization plan).
- Verification: Kiểm tra FPS trên Chrome DevTool thấy FPS bị tụt lúc kéo chuột.

## Log #20
- Date: 2026-06-15
- Author: Trần Công Tú
- AI Tool: Antigravity
- Purpose: Refactor logic lưu state Undo/Redo.
- Prompt Reference: PROMPTS.md#prompt-20
- AI Output Summary: AI đưa ra custom hook dùng debounce quá phức tạp.
- Human Decision: Không cam chịu xài code rối, tôi dùng Claude viết lại cho sạch đẹp, rồi ép Antigravity tích hợp vào. AI hỗ trợ chéo nhau và tôi là người duyệt.
- Applied To: Frontend (`useUndoRedo.js`).
- Verification: Mượt mà trở lại, test FPS duy trì ổn định mức 60.


### Phase 4: Bảo mật, Tối ưu hóa hệ thống & DevOps (16/06 - 27/06)

## Log #21
- Date: 2026-06-18
- Author: Trần Công Tú
- AI Tool: Kiro
- Purpose: Xử lý lỗi crash giao diện khi DB có xung đột.
- Prompt Reference: PROMPTS.md#prompt-21
- AI Output Summary: Kiro chỉ ra React bị thiếu Error Boundary để đón lỗi từ Optimistic Locking của DB.
- Human Decision: Không để web bị trắng xóa. Thiết kế UI báo lỗi xịn xò (Graceful Degradation) và ép Coder tích hợp.
- Applied To: Frontend Error Handling.
- Verification: Mô phỏng 2 trình duyệt cùng sửa 1 task, trình duyệt thứ 2 hiện popup thông báo trang nhã.

## Log #22
- Date: 2026-06-20
- Author: Trần Công Tú
- AI Tool: Claude
- Purpose: Tái cấu trúc "nợ kỹ thuật" - chia nhỏ code phình to.
- Prompt Reference: PROMPTS.md#prompt-22
- AI Output Summary: Claude chia file 1500 dòng thành các Custom Hook theo nguyên tắc Separation of Concerns.
- Human Decision: Nhận ra code dài là thảm họa bảo trì. Tôi đã làm vai trò của Reviewer, gỡ mớ bòng bong do Antigravity viết và phân tách rành mạch.
- Applied To: Code Architecture & Maintainability.
- Verification: Cấu trúc code sạch sẽ, dễ đọc, không phát sinh bug sau khi tách.

## Log #23
- Date: 2026-06-22
- Author: Trần Công Tú
- AI Tool: Claude
- Purpose: Tối ưu hoá đường mạng cho WebSockets (Concurrency).
- Prompt Reference: PROMPTS.md#prompt-23
- AI Output Summary: Đề xuất kiến trúc thuật toán Delta Update (Gửi tọa độ vi phân).
- Human Decision: Đập bỏ code WebSocket cũ tốn tài nguyên của Coder AI. Cập nhật giải pháp siêu tiết kiệm mạng để đáp ứng hàng chục user.
- Applied To: Real-time Communication.
- Verification: Treo 20 máy sinh viên test hệ thống, biểu đồ di chuyển nhịp nhàng không bị văng.

## Log #24
- Date: 2026-06-25
- Author: Trần Công Tú
- AI Tool: Claude
- Purpose: Tự động hóa viết Document.
- Prompt Reference: PROMPTS.md#prompt-24
- AI Output Summary: File README hướng dẫn sinh viên sử dụng app.
- Human Decision: Đọc soát lỗi chính tả, văn phong AI hơi "tây", tự dịch và sửa lại cho giống giọng văn người Việt. Gắn thêm ảnh minh họa.
- Applied To: Project (`README.md`).
- Verification: Đưa cho một bạn khác không thuộc nhóm đọc thử xem có làm theo được không.

## Log #25
- Date: 2026-06-27
- Author: Trần Công Tú
- AI Tool: Gemini
- Purpose: Tự động hóa quá trình Deploy (CI/CD Pipeline).
- Prompt Reference: PROMPTS.md#prompt-25
- AI Output Summary: Gen ra file cấu hình deploy.yml.
- Human Decision: Vượt ra khỏi ranh giới code tính năng, tôi tiến vào tự động hóa DevOps để chứng minh năng lực triển khai phần mềm (SDLC) khép kín.
- Applied To: GitHub Actions & Render Deployment.
- Verification: Code merge vào main -> Trigger Github Action -> Server Render tự động nhận bản cập nhật thành công.
