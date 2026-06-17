# Nhật ký phát triển: Tính năng Trang cá nhân (User Profile) & Đồng nghiệp (Teammates)

Tài liệu này ghi nhận toàn bộ các công việc, lỗi đã sửa và tính năng được nâng cấp trong phiên làm việc vừa qua liên quan đến phân hệ Trang cá nhân (User Profile) và kết nối đồng nghiệp.

---

## 1. Sửa lỗi sập trang cá nhân (Lỗi thống kê Statistics 500)
- **Vấn đề**: Khi truy cập trang cá nhân, API lấy thống kê `/api/v1/profile/statistics` trả về lỗi `500 Internal Server Error`, khiến toàn bộ phần thống kê không thể tải được.
- **Nguyên nhân**: 
  - Trong HQL (JPQL) của [TaskRepository.java](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/repository/TaskRepository.java), câu truy vấn viết trực tiếp đường dẫn Enum đầy đủ `org.example.backend.entity.TaskStatus.DONE` để so sánh trạng thái khiến trình phân tích HQL của Hibernate bị lỗi cú pháp lúc chạy.
  - Mặc dù hệ thống đã bọc try-catch (`safeCount`), nhưng trong cơ chế của Spring/Hibernate, bất kỳ lỗi truy vấn SQL/HQL nào xảy ra cũng sẽ đánh dấu Transaction hiện tại là **rollback-only**. Khi kết thúc hàm, Spring cố gắng commit transaction và ném ra `UnexpectedRollbackException` làm sập toàn bộ API.
- **Giải pháp**: 
  - Thay thế toàn bộ cụm `org.example.backend.entity.TaskStatus.DONE` thành chuỗi literal `'DONE'` giống với các truy vấn mẫu khác trong repository. Lỗi đã được khắc phục triệt để.

---

## 2. Tính năng tải ảnh đại diện từ máy tính (Upload Avatar)
- **Backend**:
  - Viết mới endpoint `POST /api/v1/profile/avatar` trong [ProfileController.java](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/controller/ProfileController.java), nhận file ảnh dạng `multipart/form-data`.
  - Tích hợp với `FileStorageService` để đẩy trực tiếp ảnh lên Cloudinary và trả về đường dẫn HTTPS.
- **Cơ chế dự phòng khi dùng tài khoản "demo"**:
  - Do cấu hình Cloudinary mặc định trong dự án là `"demo"`, việc upload ảnh thật sẽ bị lỗi xác thực khóa (`Invalid api_key demo`).
  - Đã cập nhật [CloudinaryFileStorageServiceImpl.java](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/service/impl/CloudinaryFileStorageServiceImpl.java) để tự động nhận diện tài khoản `"demo"`. Khi phát hiện, hệ thống sẽ in cảnh báo log và tự động trả về một **đường dẫn ảnh avatar mẫu thật có độ phân giải cao** từ Unsplash để bạn chạy thử nghiệm giao diện trơn tru mà không cần tài khoản thật.
- **Tăng giới hạn file & xử lý lỗi dung lượng**:
  - Tăng giới hạn tải file trong file cấu hình [application.yaml](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/resources/application.yaml) từ mặc định `1MB` lên `10MB`.
  - Thêm bộ bắt lỗi `MaxUploadSizeExceededException` tại [GlobalExceptionHandler.java](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/exception/GlobalExceptionHandler.java) để trả về thông báo lỗi thân thiện nếu ảnh quá nặng.
- **Frontend**:
  - Thêm phương thức `uploadAvatar(file)` vào [profileService.js](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/frontend/src/features/profile/services/profileService.js).
  - Tích hợp nút bấm **Upload Image** bên cạnh ô nhập URL tại [ProfilePage.jsx](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/frontend/src/features/profile/pages/ProfilePage.jsx). Khi chọn file, ảnh sẽ được đẩy lên trong background, tự động cập nhật đường dẫn vào form và hiển thị xem trước. Cập nhật hàm catch lỗi hiển thị chính xác nguyên nhân lỗi từ backend lên Toast thay vì báo chung chung.

---

## 3. Tính năng Đồng nghiệp làm chung (Teammates / Co-workers)
- **Backend**:
  - Tạo mới DTO [CoWorkerResponse.java](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/dto/CoWorkerResponse.java) để chứa thông tin đồng nghiệp.
  - Viết câu truy vấn JPQL tổng hợp số lượng dự án làm việc chung giữa người dùng hiện tại và những người khác thông qua bảng `ProjectMember` trong [ProjectMemberRepository.java](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/repository/ProjectMemberRepository.java).
  - Thêm service method `getCoWorkers` trong [ProfileServiceImpl.java](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/service/impl/ProfileServiceImpl.java) để định dạng và sắp xếp danh sách đồng nghiệp theo số lượng dự án làm chung giảm dần.
  - Mở API endpoint `GET /api/v1/profile/coworkers` trong [ProfileController.java](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/backend/src/main/java/org/example/backend/controller/ProfileController.java).
- **Frontend**:
  - Thêm hàm gọi API trong [profileService.js](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/frontend/src/features/profile/services/profileService.js).
  - Vẽ card giao diện **Teammates / Co-workers** hiển thị ở cột bên phải trang [ProfilePage.jsx](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/frontend/src/features/profile/pages/ProfilePage.jsx), hiển thị ảnh đại diện, họ tên, email/username và huy hiệu số lượng dự án làm chung.

---

## 4. Tích hợp phím tắt xem trang cá nhân (Sidebar)
- **Frontend**:
  - Cập nhật [Sidebar.jsx](file:///d:/FPTU/kì%205/SWP391/git/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/code/frontend/src/components/layout/Sidebar.jsx):
  - Biến đổi phần thẻ hiển thị thông tin người dùng đăng nhập ở dưới cùng Sidebar bên trái thành khu vực click được (`cursor-pointer`).
  - Bổ sung hiệu ứng hover và chỉ dẫn chuột.
  - Khi click vào bất kỳ vị trí nào trên thẻ tên/avatar này, hệ thống sẽ tự động điều hướng trực tiếp sang trang cá nhân `/profile`.
