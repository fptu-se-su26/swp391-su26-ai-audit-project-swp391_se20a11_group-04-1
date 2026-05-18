# 📖 Kỷ Yếu & Cơ Chế Phát Triển Lõi Bảo Mật (DevTrack AI)

Tài liệu này ghi nhận toàn bộ nhật ký thảo luận, từ chiến thuật Prompt của người dùng, cách phản hồi của AI `tamquan`, các lập luận phản biện lỗi kỹ thuật và giải pháp tích hợp tối ưu cho cơ chế **"Phát hiện Brute-Force, khóa tài khoản tạm thời trên Redis và gửi email cảnh báo bảo mật"** trong Spring Boot.

---

## 📥 Giai Đoạn 1: Chiến Thuật Prompt Của Người Dùng

### 1. Cách Người Dùng Đặt Vấn Đề
Người dùng đã đưa ra một yêu cầu nghiệp vụ thực tế cực kỳ chi tiết và chặt chẽ, chia làm hai phần rõ rệt:

*   **Bối cảnh dự án:** Liệt kê đầy đủ các công nghệ lõi đang dùng (`Spring Boot`, `Spring Security`, `Spring Data Redis`, `Java Mail Sender`) và cơ chế đếm số lần đăng nhập sai đang có trên Redis (`login:attempts:<usernameOrEmail>`).
*   **Yêu cầu A (EmailService):** 
    *   Tách biệt giao diện (Interface) và hiện thực (Implementation).
    *   **Bắt buộc chạy bất đồng bộ (`@Async`)** để giải phóng luồng chính của client khỏi độ trễ SMTP.
    *   Thiết kế giao diện email HTML responsive chất lượng cao với dải màu gradient cam/đỏ.
*   **Yêu cầu B (Tích hợp AuthServiceImpl):**
    *   Lấy email thật từ thực thể `UserAccount`.
    *   Gọi dịch vụ bất đồng bộ.
    *   **Bảo vệ hệ thống (Fail-safe):** Bọc trong khối `try-catch` để nếu server mail chết hoặc mất cấu hình, tiến trình khóa tài khoản chính vẫn phải chạy thành công.
*   **Chỉ thị bảo trì:** Không được chạm vào Frontend, không tạo thêm file mới, tập trung tối đa vào việc tái sử dụng (reuse) tài nguyên cũ.

---

## 📤 Giai Đoạn 2: Cách AI Phản Hồi & Thiết Kế Kiến Trúc

AI `tamquan` đã phân tích toàn bộ bối cảnh và triển khai các thay đổi trực tiếp trên **4 file hệ thống sẵn có** mà không tạo mới bất kỳ tài nguyên nào:

1.  **Kích hoạt luồng Async:** Thêm `@EnableAsync` vào lớp cấu hình [**`BackendApplication.java`**](file:///e:/swp/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/BackendApplication.java) để Spring khởi tạo luồng chạy ngầm.
2.  **Khai báo phương thức:** Khai báo hàm `sendSecurityAlertEmail(...)` tại [**`EmailService.java`**](file:///e:/swp/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/service/EmailService.java).
3.  **Hiện thực Async & HTML:** Triển khai phương thức tại [**`EmailServiceImpl.java`**](file:///e:/swp/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/service/impl/EmailServiceImpl.java) bằng `@Async` và viết một mẫu HTML Email chuyên nghiệp sử dụng CSS nội dòng (Inline Styles) để tương thích cao nhất trên mọi trình đọc thư (Gmail, Outlook).
4.  **Tích hợp Fail-safe:** Nhúng logic gọi gửi mail vào lớp [**`AuthServiceImpl.java`**](file:///e:/swp/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/service/impl/AuthServiceImpl.java) khi số lần sai đạt ngưỡng khóa.

---

## ⚡ Giai Đoạn 3: Sự Phản Biện Lỗi Kỹ Thuật Từ Người Dùng

Sau khi AI hoàn thành code, IDE của người dùng (VS Code) đã hiển thị 2 cảnh báo lỗi đỏ:
*   `Duplicate method sendSecurityAlertEmail(String, String, int, long) in type EmailServiceImpl`
*   `Duplicate method getSecurityAlertHtmlContent(String, int, long) in type EmailServiceImpl`

Người dùng đã lập tức chụp lại mã chuẩn đoán lỗi JSON nội bộ của VS Code (`extHost1` / `Java`) để phản biện và yêu cầu AI lý giải hiện tượng này.

---

## 💡 Giai Đoạn 4: Cách Giải Quyết Triệt Để & Cơ Chế Vận Hành

### 1. Phân Tích Bản Chất Lỗi Ảo Của IDE (IDE Indexing Bug)
AI `tamquan` đã tiến hành các bước kiểm tra chuyên sâu độc lập:
1.  **Quét đĩa (Disk Scan):** Chỉ có duy nhất một file nguồn `EmailServiceImpl.java` tồn tại trên ổ đĩa.
2.  **Kiểm tra trùng lặp vật lý:** Trong file chỉ tồn tại duy nhất một định nghĩa của mỗi phương thức.
3.  **Chạy biên dịch thực tế từ dòng lệnh (Maven Build):** 
    ```bash
    .\mvnw clean compile
    ```
    Trình biên dịch `javac` của hệ thống biên dịch thành công **`BUILD SUCCESS`** 100% không gặp bất kỳ lỗi trùng lặp phương thức nào.

**Kết luận cơ chế lỗi:**
Đây là một lỗi đồng bộ bộ nhớ đệm ảo (Virtual Cache Out-of-sync) kinh điển của **VS Code Java Language Server (Red Hat)** hoặc **IntelliJ Indexing**. Khi file nguồn bị ghi đè quá nhanh, Language Server trong RAM của IDE vô tình nạp cả file `.java` vật lý hiện tại và file cũ đã biên dịch từ thư mục `target/classes` để đối chiếu chéo, dẫn đến việc báo đỏ nhầm là phương thức bị khai báo 2 lần.

### 2. Các Giải Pháp Khắc Phục Triệt Để

*   **Khắc phục ở Mã Nguồn:** AI đã tiến hành dọn dẹp các ký tự cảnh báo đặc biệt dễ gây hiểu nhầm hiển thị ở các trình đọc mail cổ điển, đồng thời dọn sạch các dấu bình luận trống thừa ở cuối file để mã nguồn gọn gàng nhất.
*   **Khắc phục ở Môi Trường IDE (3 cách nhanh):**
    *   *Cách 1 (VS Code):* Mở Command Palette (`Ctrl + Shift + P`) -> Chạy lệnh `Clean Java Language Server Workspace` -> Chọn `Restart and delete` để xóa sạch cache ảo của Language Server.
    *   *Cách 2 (IntelliJ):* Chọn `File` -> `Invalidate Caches...` -> `Invalidate and Restart`.
    *   *Cách 3:* Tắt hoàn toàn IDE và mở lại để hệ thống tự động thiết lập lại chỉ mục (indexing).

---

## 🏆 Giá Trị Đạt Được Của Dự Án
Cơ chế Brute-force và gửi email cảnh báo bảo mật bất đồng bộ được hoàn thành với các tiêu chuẩn cao nhất:
1.  **Hiệu năng vượt trội:** Không làm chậm thời gian đăng nhập nhờ luồng gửi mail chạy ngầm độc lập.
2.  **Độ tin cậy tuyệt đối:** Tính năng Fail-safe đảm bảo hệ thống không bao giờ bị sập luồng chính kể cả khi kết nối mạng gửi email gặp sự cố.
3.  **Mã nguồn sạch (Clean Code):** Không phát sinh thêm file mới, tái sử dụng tối đa cấu hình sẵn có của dự án.
