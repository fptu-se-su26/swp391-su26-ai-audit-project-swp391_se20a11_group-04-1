# AI Learning Reflection

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
| Ngày hoàn thành reflection | 27/06/2026 |

---

## 2. Mục đích Reflection

File này dùng để tự đánh giá quá trình định hướng, kiểm soát và vận hành AI để tạo ra một hệ thống phần mềm hoàn chỉnh thực thụ (chuẩn SDLC).

---

## 3. Tóm tắt quá trình sử dụng AI

### Tuần 1 & 2 (18/05 - 31/05): Khởi động, Giao diện & Kiến trúc Database
Trong tuần đầu, em sử dụng chủ yếu Gemini để lên ý tưởng và Claude để hỗ trợ viết Use Case. Đồ án bắt đầu với sự mạch lạc: Ý tưởng -> Thiết kế Giao diện -> Kiến trúc Database. 
Sự hỗ trợ của AI ở khâu này là rất lớn, giúp tiết kiệm hàng giờ viết văn bản. Bài học rút ra: Không phải AI vẽ ra chức năng nào cũng phù hợp. Claude từng đề xuất một luồng "Approve Task" khá phức tạp dành cho doanh nghiệp lớn. Nếu em copy bừa vào đồ án sinh viên thì sẽ không có thời gian code và sai lệch nghiệp vụ. Do đó em học được cách phải đọc và lược bỏ ý tưởng dư thừa của AI. 
Khi gen UI, AI nhét sẵn mảng Array Fake (Mock Data). Em dọn dẹp sạch sẽ, bắt nó chừa chỗ để lát nữa Backend trả về. Về Database, em chọn PostgreSQL để bảo toàn điểm số (chuẩn ACID), và nhờ Claude viết DDL kẹp sẵn Optimistic Locking (chống 2 người sửa chung 1 Task), tích hợp luôn DB Migration (Knex) để code chạy tới đâu DB nâng cấp an toàn tới đó.

### Tuần 3 (01/06 - 07/06): Nỗi đau End-to-End Testing & Sửa lỗi bảo mật
Bắt tay vào code API bằng Antigravity, em nhận thấy code do AI sinh ra (như hàm Auth) chạy được bề nổi nhưng rất dễ bị lủng bảo mật. Cụ thể, hàm auth của AI quên mất try/catch khi token hết hạn. 
Thêm vào đó, mọi thứ qua mắt rất dễ dàng nếu chỉ dùng Postman (báo 200 Success). Nhưng với tư duy E2E, em bật pgAdmin soi tận đáy Database và ngỡ ngàng: Bảng rỗng tuếch! AI chỉ console.log truy vấn chứ lười không gửi lệnh pool.query xuống DB. Em phát cáu, dùng Claude viết hẳn bộ "Luật Thép" cấm giả mạo, ép AI làm ăn chân thực. 
Đến lúc giải quyết lỗi CORS, tự mày mò rất mất thời gian. Kiro đã phát huy tác dụng cực tốt như một công cụ dò bug. Tuy nhiên, em tự bắt bản thân phải hiểu Tại sao SameSite lại gây lỗi cookie, thay vì chỉ dán đoạn code Kiro đưa vào.

### Tuần 4 (08/06 - 15/06): Kỹ năng Prompt Engineering & Đập đi xây lại
Vẽ biểu đồ là module cốt lõi. Ban đầu tính xài Mermaid.js vì thấy AI bảo dễ. Làm xong thấy đơ như hình ảnh JPEG. Em đập đi không thương tiếc, tìm bằng được nền tảng React Flow xịn xò.
Thay vì ném một câu vô nghĩa "Hãy code cho tôi trang vẽ UML" cho AI và nhận lại rác, em đã có chiến thuật: Lên Claude viết "Master Prompt" phân rã kiến trúc (chia cấu trúc Node, Edge rõ ràng). Sau khi hiểu kiến trúc, em mới đưa prompt cho Antigravity code từng phần nhỏ. 
Khi AI code sai lỗi kết nối Edge, em không hoảng loạn. Em đưa log cho Kiro đọc, xác định lỗi ở đâu (do lệch ID), rồi quay lại bắt Antigravity phải code theo đúng ID em quy định. Ở tuần 4, khi Undo/Redo bị lag, AI Coder đưa ra một Custom Hook rất rườm rà. THAY VÌ ĐỒNG Ý VỚI CODE ĐÓ, em quyết định mang đoạn code phức tạp đó đưa sang cho Claude, yêu cầu nó tìm ra thuật toán sạch đẹp hơn (Debounce). Sau đó em đem ngược về ép Antigravity phải code theo. Em là người điều hướng cuối cùng.

### Tuần 5 & 6 (16/06 - 27/06): Kiến trúc Enterprise, Tối ưu & Tự động hoá DevOps
Đến giai đoạn làm tính năng đỉnh cao: Nhiều sinh viên cùng vẽ sơ đồ (WebSockets). Antigravity code tham lam, gửi nguyên mảng data cả MB/giây làm treo web. Lần nữa, em không xài code đó. Em ép Claude phân tích thuật toán truyền mạng, tìm ra giải pháp Delta Update (nén điểm dịch chuyển). Em bắt Antigravity xóa hết, làm đúng giải pháp đó. Mượt mà vô song.
Khi hệ thống bị Crash màn hình trắng do "Đụng độ khóa Optimistic DB", em đã xử lý nó bài bản bằng Error Boundary ở bề mặt React. Nợ kỹ thuật phình to (file 1500 dòng), em ép tách ra 5 custom hooks (Separation of Concerns). Cuối cùng, để khẳng định vòng đời phần mềm khép kín, em nhờ Gemini dựng luồng CI/CD GitHub Actions. Push code là test, test pass là Deploy tự động lên Render. 

### 4. Tổng kết và Đánh giá
Trải qua toàn bộ vòng đời phát triển dự án từ lúc hình thành ý tưởng cho đến khi tự động hóa triển khai, em nhận ra rằng việc ứng dụng AI vào lập trình không hề đơn giản như việc chỉ đưa ra một câu lệnh và nhận về một phần mềm hoàn chỉnh. Nếu không tuân thủ nghiêm ngặt quy trình phát triển phần mềm chuẩn mực (SDLC) đi từ thiết kế cơ sở dữ liệu, viết API đến tối ưu hóa, thì sản phẩm tạo ra chỉ là một mớ code chắp vá và rất dễ sụp đổ khi gặp lỗi thực tế.

Trong đồ án này, em đã học được cách định vị bản thân không chỉ là một người đi gõ code, mà là một người thiết kế hệ thống và kiểm soát chất lượng. Khi trí tuệ nhân tạo có thể viết code rất nhanh, giá trị cốt lõi của sinh viên nằm ở tư duy phân tích yêu cầu, khả năng thiết kế kiến trúc chuẩn công nghiệp như Database Migration hay cấu trúc thư mục React, và đặc biệt là kỹ năng kiểm thử toàn diện (End-to-End Testing) để phát hiện ra những điểm bất hợp lý mà AI tạo ra. Quá trình tự mình tìm tòi, ép buộc AI sửa lỗi từ cấp độ cơ sở dữ liệu cho đến thuật toán đường truyền mạng WebSockets đã giúp em thực sự làm chủ được dự án của mình, biến AI thành một trợ lý đắc lực thay vì một rủi ro tiềm ẩn.
