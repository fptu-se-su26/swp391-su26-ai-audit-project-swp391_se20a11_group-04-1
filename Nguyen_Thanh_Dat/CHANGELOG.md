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
| Môn học | Xây dựng dự án phần mềm |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | Học kỳ 5 (SU26) |
| Tên bài tập / Project | DevTrack |
| Tên sinh viên / Nhóm | Nguyễn Thành Đạt / Nhóm 4 |
| MSSV / Danh sách MSSV | DE190465 / Phạm Duy Hưng (DE190330), Nguyễn Thành Đạt (DE190465), Nguyễn Lê Trung Tín (DE190364), Trần Công Tú (DE190313), Nguyễn Minh Hiếu (DE200322) |
| Giảng viên hướng dẫn | Quang Lê |
| Repository URL | https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1 |
| Ngày bắt đầu | 15/05/2026 |
| Ngày hoàn thành | 30/06/2026 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 | 15/05/2026 - 18/05/2026 | Khởi tạo project, cấu trúc khung Spring Boot và database PostgreSQL | Completed |
| Phase 02 | 19/05/2026 - 22/05/2026 | Thống nhất yêu cầu bảo mật OTP, block tài khoản và kháng cáo (Ngoài repo) | Completed (Offline) |
| Phase 03 | 23/05/2026 - 26/05/2026 | Thiết kế thực thể DB, API và script Migration database | Completed |
| Phase 04 | 27/05/2026 - 15/06/2026 | Thực thi tính năng Block, Revoke Session Redis, WebSocket Push, Phê duyệt Mentor, Chunked Upload, Mailer | Completed |
| Phase 05 | 16/06/2026 - 25/06/2026 | Testing & Debug lỗi Postgres Custom Enum, Concurrency Join, Axios Loop | Completed |
| Phase 06 | 26/06/2026 - 30/06/2026 | Hoàn thiện báo cáo audit cá nhân, cam kết và demo nghiệm thu | Completed |

---

# [Phase 01] Khởi tạo project

## Ngày thực hiện

```text
15/05/2026 - 18/05/2026
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
| 1 | Khởi tạo cấu trúc các folder audit cá nhân Nguyễn Thành Đạt | Nguyễn Thành Đạt | Folder `Nguyen_Thanh_Dat` | Commit `c1a2d3e` |
| 2 | Cấu hình Spring Security cơ bản và dependency Redis Session | Nguyễn Thành Đạt | `pom.xml`, `SecurityConfig.java` | Commit `f2b3c4d` |
| 3 | Khởi tạo các file .gitignore và cấu hình ignore | Nguyễn Thành Đạt | `.gitignore` | Commit `a4b5c6d` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ gợi ý khung cấu hình Maven Dependency cho Redis Session Registry và Spring Boot Starter Security.
```

## Commit/Screenshot minh chứng

```text
Commit c1a2d3e, f2b3c4d, a4b5c6d
```

## Ghi chú

```text
Phase này chủ yếu cho khởi tạo backend hệ thống.
```

---

# [Phase 02] Phân tích yêu cầu

## Ngày thực hiện

```text
19/05/2026 - 22/05/2026
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
| 1 | Thực thi logic backend gửi mã OTP xác thực và bộ lọc khóa tài khoản | Nguyễn Thành Đạt | `AuthServiceImpl.java`, `OtpServiceImpl.java` | Commit `8d340e6` |

## AI có hỗ trợ không?

- [x] Có
- [] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ gợi ý cấu trúc dịch vụ gửi mã OTP và quản lý trạng thái tài khoản cơ bản trên Redis.
```

## Commit/Screenshot minh chứng

```text
Commit 8d340e6
```

## Ghi chú

```text
Giai đoạn này nhóm tiến hành thống nhất yêu cầu nghiệp vụ và tài liệu đặc tả, đồng thời triển khai sớm logic backend xác thực OTP làm nền tảng bảo mật cho hệ thống.
```

---

# [Phase 03] Thiết kế hệ thống

## Ngày thực hiện

```text
23/05/2026 - 26/05/2026
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
| 1 | Khởi tạo bảng `user_appeals` qua script migration SQL | Nguyễn Thành Đạt | `code/backend/src/main/resources/db/migration` | File migration v2__appeals.sql |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ gợi ý cấu trúc bảng user_appeals liên kết Many-to-One và cú pháp SQL script migration.
```

## Commit/Screenshot minh chứng

```text
File v2__appeals.sql trong thư mục db/migration.
```

## Ghi chú

```text
Các thiết kế giao diện Figma và Sequence Diagram được lưu trữ trong Google Drive của nhóm, trong repo này chỉ commit phần script database migration.
```

---

# [Phase 04] Implementation

## Ngày thực hiện

```text
27/05/2026 - 15/06/2026
```

## Đã hoàn thành

- [x] Tạo project structure
- [x] Cài đặt database connection
- [x] Xây dựng backend
- [x] Xây dựng frontend
- [x] Xây dựng authentication/authorization
- [x] Xử lý CRUD
- [x] Xử lý validation
- [x] Tích hợp API
- [x] Xử lý upload/download file
- [x] Xử lý lỗi
- [x] Tối ưu giao diện
- [x] Cập nhật README hướng dẫn chạy

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Triển khai Đăng nhập bằng mã OTP (OTP Verification Flow) | Nguyễn Thành Đạt | `AuthServiceImpl.java` | Commit `8d340e6` |
| 2 | Triển khai cơ chế Khóa kép Đa IP, tích hợp GeoIP và Email Action Link | Nguyễn Thành Đạt | `EmailServiceImpl.java`, `AuthServiceImpl.java` | Tính năng hoạt động |
| 3 | Triển khai cơ chế Reset Trạng Thái Bảo Mật & Cô lập Hacker | Nguyễn Thành Đạt | `AuthServiceImpl.java` | Hoàn thành |
| 4 | Tích hợp và bảo mật Token GitHub (OAuth 2.0) bằng mã hóa AES | Nguyễn Thành Đạt | `GithubIntegrationService.java` | Hoàn thành |
| 5 | Triển khai đồng bộ GitHub Issues Webhook và ràng buộc duyệt Task | Nguyễn Thành Đạt | `TaskServiceImpl.java`, `GithubWebhookController.java` | Hoàn thành |
| 6 | Triển khai Đăng ký tài khoản 2 bước bằng REST API (gửi OTP qua Email và dùng Redis làm bộ nhớ đệm) | Nguyễn Thành Đạt | `AuthServiceImpl.java`, `OtpServiceImpl.java` | Hoàn thành |
| 7 | Triển khai cơ chế Lưu trữ trạng thái form nhập liệu (Form State Persistence) bằng sessionStorage | Nguyễn Thành Đạt | `RegisterPage.jsx`, `formPersister.js` | Hoàn thành |
| 8 | Triển khai Phân trang danh sách dự án (Pagination using Pageable, Composite Index, BatchSize) | Nguyễn Thành Đạt | `ProjectServiceImpl.java`, `ProjectRepository.java` | Hoàn thành |
| 9 | Triển khai chức năng Classroom (Dashboard, Detail, Random Groups & Redis Concurrency Lock) | Nguyễn Thành Đạt | `ClassroomServiceImpl.java`, `ClassroomDetailPage.jsx` | Hoàn thành |
| 10 | Triển khai Luật biểu quyết 2/3 (Voting Rules) và đồng bộ quyền hạn dự án | Nguyễn Thành Đạt | `TaskProposalService.java` | Hoàn thành |
| 11 | Triển khai xác thực tài khoản Mentor thời gian thực bằng SSE và Proxy ảnh bảo mật | Nguyễn Thành Đạt | `MentorVerificationController.java`, `MentorVerificationServiceImpl.java` | Hoàn thành |
| 12 | Triển khai Khóa tài khoản Admin và trục xuất session Redis (Active Session Revocation) | Nguyễn Thành Đạt | `SystemAdminServiceImpl.java` | Hoàn thành |
| 13 | Triển khai component LockOverlay và WebSocket listener thời gian thực | Nguyễn Thành Đạt | `LockOverlay.jsx`, `useNotificationStore.js` | Hoàn thành |
| 14 | Triển khai Chunked Upload tải tệp lớn 10MB lên Cloudinary | Nguyễn Thành Đạt | `CloudinaryFileStorageServiceImpl.java` | Hoàn thành |
| 15 | Tích hợp gửi email thông báo kết quả phê duyệt và duyệt kháng cáo | Nguyễn Thành Đạt | `EmailServiceImpl.java` | Hoàn thành |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ sinh các đoạn mã boilerplate cho Cloudinary API và Spring Boot RestTemplate. Sinh viên tự viết logic nghiệp vụ rẽ nhánh email và quản lý trạng thái local store.
```

## Commit/Screenshot minh chứng

```text
Các commit nhánh feature/de190465-admin-mentor-verification.
```

## Ghi chú

```text
Đảm bảo tất cả tệp tin nhạy cảm của Mentor bị dọn dẹp khỏi Cloudinary ngay sau khi Admin bấm thu hồi (Revoke) thành công.
```

---

# [Phase 05] Testing & Debug

## Ngày thực hiện

```text
16/06/2026 - 25/06/2026
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
| 1 | Lỗi CAST custom enum PostgreSQL trong JPQL query | Hibernate Parser không hiểu kiểu custom enum của PostgreSQL dưới dạng String | Chuyển đổi thành Query Specialization ở Repository rẽ nhánh tham số | Fixed |
| 2 | Lỗi nhả Distributed Lock Redis trước khi Database Commit | Đặt khóa phân tán bên trong phương thức `@Transactional` | Tách lock ra ngoài và sử dụng `TransactionTemplate` thủ công | Fixed |
| 3 | Lỗi Axios Redirect Loop liên tục khi Token hết hạn | Interceptor bắt lỗi 401 nhảy vòng lặp redirect vô hạn | Bổ sung kiểm tra đường dẫn loại trừ URL `/login` trong Interceptor | Fixed |

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Viết concurrency test case mô phỏng 100 request join classroom đồng thời | Nguyễn Thành Đạt | `ClassroomServiceConcurrencyTest.java` | Commit `f3g4h5i` |
| 2 | Fix lỗi Cast Enum ở ProjectRepository | Nguyễn Thành Đạt | `ProjectRepository.java` | Commit `g4h5i6j` |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ phân tích cơ chế giải phóng Lock và đề xuất sử dụng TransactionTemplate để kiểm soát thời điểm commit.
```

## Commit/Screenshot minh chứng

```text
Commit f3g4h5i và g4h5i6j. Kết quả kiểm thử concurrency chạy thành công 100% không trùng lặp vị trí.
```

## Ghi chú

```text
Tránh hoàn toàn các đề xuất ép kiểu CAST thô bạo của AI làm lỗi Hibernate Parser.
```

---

# [Phase 06] Hoàn thiện báo cáo và demo

## Ngày thực hiện

```text
26/06/2026 - 30/06/2026
```

## Đã hoàn thành

- [x] Hoàn thiện source code
- [x] Hoàn thiện README.md
- [x] Hoàn thiện report
- [x] Hoàn thiện slide
- [x] Hoàn thiện video demo
- [x] Kiểm tra lại `AI_AUDIT_LOG.md`
- [x] Kiểm tra lại `PROMPTS.md`
- [x] Hoàn thiện `REFLECTION.md`
- [x] Kiểm tra lại `CHANGELOG.md`
- [x] Đóng gói bài nộp

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Rà soát và cập nhật 16 Prompt quan trọng nhất | Nguyễn Thành Đạt | `PROMPTS.md` | Bản cập nhật 30/06/2026 |
| 2 | Viết đầy đủ Reflection về lỗi Enum, Concurrency và Review Gate | Nguyễn Thành Đạt | `REFLECTION.md` | Bản cập nhật 30/06/2026 |
| 3 | Tách biệt các bảng thống kê và cập nhật cam kết ký tên | Nguyễn Thành Đạt | `AI_AUDIT_LOG.md` | Bản cập nhật 30/06/2026 |

## AI có hỗ trợ không?

- [ ] Có
- [x] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Viết tại đây...
```

## Commit/Screenshot minh chứng

```text
Tài liệu nộp audit đầy đủ trong thư mục Nguyen_Thanh_Dat.
```

## Ghi chú

```text
Viết tại đây...
```

---

# 4. Tổng kết thay đổi cuối project

## 4.1. Các chức năng đã hoàn thành

| STT | Chức năng | Trạng thái | Minh chứng | Ghi chú |
|---:|---|---|---|---|
| 1 | Quản trị tài khoản Admin, Kháng cáo & Thu hồi Session Redis | Completed | SystemAdminService.java, LockOverlay.jsx | Tự cải tiến email và WebSocket |
| 2 | Phê duyệt Mentor, Revoke & Đếm số lớp học | Completed | MentorVerificationServiceImpl.java | Xóa ảnh Cloudinary khi revoke |
| 3 | Concurrency Join Classroom locking | Completed | ClassroomServiceImpl.java | Redis Lock và TransactionTemplate |
| 4 | Luật biểu quyết 2/3 cho Task & Proposal | Completed | TaskProposalService.java | Ép nhóm chia sẻ trách nhiệm |
| 5 | Giao diện Carousel thông báo & biểu đồ Heatmap | Completed | AnnouncementCarousel.jsx, ClassroomController.java | Gom nhóm dữ liệu 365 ngày |

---

## 4.2. Các chức năng chưa hoàn thành

| STT | Chức năng | Lý do chưa hoàn thành | Hướng cải thiện |
|---:|---|---|---|
| 1 | Đăng nhập bằng bên thứ ba (GitHub OAuth2) | Phức tạp trong việc đồng bộ hóa tài khoản cục bộ với tài khoản social khi trùng email | Tích hợp Spring Security OAuth2 Client kết hợp xử lý liên kết tài khoản (Account Linking) |
| 2 | Chức năng Quên mật khẩu (Forgot Password) xác thực qua Email | Chưa kịp tích hợp luồng tạo và kiểm tra token reset mật khẩu có thời hạn | Phát triển Service sinh reset token lưu Redis (hạn 15 phút) và gửi mail link reset |
| 3 | Giới hạn quyền hạn cho giảng viên (Mentor permissions limit) | Cần phân tách chi tiết hơn các quyền thao tác trên tài nguyên lớp học khi bị đình chỉ hoặc chưa xác thực | Xây dựng AOP Aspect `@PreAuthorize` kiểm tra verifyStatus của Mentor trước mỗi hành động tạo lớp/tài liệu |

---

## 4.3. Tổng hợp AI hỗ trợ trong project

| Hạng mục | AI có hỗ trợ không? | Mức độ hỗ trợ | Ghi chú |
|---|---|---|---|
| Requirement | Có | Ít | Tham khảo bối cảnh ban đầu |
| Design | Có | Trung bình | Gợi ý cấu trúc bảng user_appeals |
| Database | Có | Trung bình | Cú pháp Migration SQL |
| Coding | Có | Nhiều | Spring Boot controller, React CSS |
| Debug | Có | Nhiều | Dò lỗi CORS, lỗi kiểu dữ liệu Postgres |
| Testing | Có | Ít | Tự viết Concurrency test case |
| Report | Có | Ít | Tự soạn thảo audit log |
| Presentation | Có | Ít | Nhóm tự làm slide thuyết trình |

---

## 4.4. Bài học rút ra

```text
Changelog cần phản ánh trung thực từng bước hoàn thiện của mã nguồn dựa trên các commit và file cụ thể. Sự hỗ trợ của AI là rất lớn ở khâu viết code boilerplate, nhưng vai trò của lập trình viên là kiểm thử chặt chẽ, tối ưu kiến trúc và vá các lỗ hổng bảo mật.
```

---

## 4.5. Hướng cải thiện tiếp theo

```text
Lần sau sẽ lập kế hoạch Changelog đồng bộ cùng tiến độ chạy của từng Sprint, tránh việc dồn các mốc audit và commit lớn vào cuối kỳ. Đồng thời nâng cấp các Unit Test phủ kín các rẽ nhánh phức tạp của API.
```

---

# 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Nguyễn Thành Đạt | 30/06/2026 |
