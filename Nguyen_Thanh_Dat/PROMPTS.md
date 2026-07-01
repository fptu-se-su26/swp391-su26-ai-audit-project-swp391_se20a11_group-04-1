# Prompt Log

## 1. Thông tin chung

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
| Ngày bắt đầu | 15/05/2026 |
| Ngày cập nhật gần nhất | 30/06/2026 |

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
- [ ] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [ ] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [ ] Công cụ khác: ....................................

---

## 4. Bảng tổng hợp prompt đã sử dụng

| STT | Ngày | Công cụ AI | Mục đích | Prompt tóm tắt | Kết quả chính | Có sử dụng vào bài không? | Minh chứng |
|---:|---|---|---|---|---|---|---|
| 1 | 15/05/2026 | ChatGPT / Gemini | Triển khai Đăng ký tài khoản 2 bước (OTP + Redis) | Thiết kế và triển khai hoàn chỉnh tính năng đăng ký 2 bước gửi OTP qua Email xác thực dùng Redis làm bộ nhớ đệm | Sinh code Java Spring Boot (Entities, DTOs, Services, Controller, Exception Handler) | Có | AuthController.java, OtpServiceImpl.java |
| 2 | 16/05/2026 | ChatGPT | Lưu nháp form đăng ký (Form State Persistence) | Thiết kế giải pháp JavaScript lưu trạng thái form nhập liệu vào sessionStorage và tự động loại bỏ mật khẩu/OTP | Module JS tự động lưu và khôi phục nháp, tự động dọn dẹp khi submit thành công | Có | RegisterPage.jsx, formPersister.js |
| 3 | 17/05/2026 | Gemini | Phân trang danh sách dự án | Phân trang dự án kèm theo lọc status và tìm kiếm name, tối ưu hóa kiểu dữ liệu enum của PostgreSQL | Thiết kế PaginatedResponse DTO, Pageable JPA, Composite Index và Query Specialization tránh lỗi cast enum PostgreSQL | Có | ProjectServiceImpl.java, ProjectRepository.java |
| 4 | 18/05/2026 | Gemini | Tìm giải pháp chống Brute Force tối ưu | Hỏi cách chống brute force và tối ưu hiệu năng DB | Đề xuất Progressive Lockout + Fast-Fail bằng Redis | Có | Commit 8d340e6 |
| 5 | 19/05/2026 | Gemini | Thiết kế Khóa kép Đa IP & Action Link Email | Yêu cầu lấy thông tin thiết bị, vị trí và tạo nút bấm mở khóa từ Email | Đề xuất phân tích User-Agent, GeoIP API và tạo Secure Token. | Có |  |
| 6 | 19/05/2026 | Gemini | Xử lý Reset Trạng Thái Bảo Mật & Cô lập Hacker | Yêu cầu làm rõ cơ chế xóa đếm lỗi và khóa IP | Đề xuất cơ chế Security State Reset thông minh, chỉ xóa IP thật. | Có |  |
| 7 | 20/05/2026 | Gemini | Bảo mật Token GitHub (OAuth 2.0) & Encryption | Cách lưu trữ token an toàn và xử lý lỗi 401 | Đề xuất mã hóa AES, log an toàn và luồng re-link. | Có |  |
| 8 | 20/05/2026 | Gemini | Đồng bộ GitHub Issues & Logic duyệt Task | Xử lý Webhook rác và chặn cập nhật trạng thái láo | Đề xuất Fast-Fail Webhook và State Machine chặn HTTP 400. | Có |  |
| 9 | 22/05/2026 | Gemini | Cơ chế Join Classroom Concurrency & Random Grouping | Hỏi cách xử lý race condition khi nhiều học sinh join lớp học cùng lúc và cơ chế chia nhóm ngẫu nhiên xóa cache Redis | Đề xuất giải pháp Redis lock (setIfAbsent) TTL 1s kết hợp TransactionTemplate, chia nhóm shuffle và quét xóa cache Redis | Có | ClassroomServiceImpl.java, ClassroomServiceConcurrencyTest.java |
| 10 | 23/05/2026 | Gemini | Thiết lập luật biểu quyết (Voting Rules) cho Task & Proposal | Đề xuất luật biểu quyết 2/3 thành viên tán thành để tăng tinh thần trách nhiệm nhóm | Triển khai luật 2/3 biểu quyết bằng phép toán số nguyên, bọc CustomException trong approveProposal và approveAndSyncTask | Có | TaskProposalService.java |
| 11 | 24/05/2026 | Gemini | Thiết lập SSE realtime & Proxy bảo vệ ảnh thẻ Mentor | Hỏi giải pháp truyền tin realtime yêu cầu Mentor và cách lưu trữ ảnh thẻ bảo mật chống IDOR | Đề xuất dùng SSE SseEmitter, lưu private và viết Proxy Endpoint kiểm soát quyền xem ảnh | Có | MentorVerificationController.java, MentorVerificationServiceImpl.java |
| 12 | 25/05/2026 | Gemini | Thiết kế banner động & Băng chuyền thông báo lớp học | Hỏi cấu trúc băng chuyền Carousel hiển thị thông tin lớp học và các thông báo trong React | Đề xuất component AnnouncementCarousel sử dụng timer useEffect và bộ lọc ngày gần nhất | Có | AnnouncementCarousel.jsx, ClassroomDetailPage.jsx |
| 13 | 26/05/2026 | Gemini | Thống kê Dashboard & Biểu đồ đóng góp lớp học | Hỏi cách tính sĩ số, đếm task, commit và vẽ Line Chart tuần tự, Contribution Heatmap | Đề xuất getClassroomDashboard gom nhóm HashMap hoạt động trong tuần và gom nhóm commit 365 ngày | Có | ClassroomServiceImpl.java, ClassroomController.java |
| 14 | 27/05/2026 | Gemini | Tải tài nguyên học tập & Tối ưu file dung lượng lớn | Hỏi giải pháp tải file dung lượng lớn tránh OutOfMemory và các ràng buộc kiểm tra đuôi file | Đề xuất chunk_size 6MB dùng uploadLarge Cloudinary API và logic lọc Whitelist phần mở rộng | Có | ResourceServiceImpl.java, CloudinaryFileStorageServiceImpl.java |
| 15 | 28/06/2026 | Gemini | Thiết kế Trang quản trị tài khoản Admin, Kháng cáo & Thu hồi Session tức thời | Thiết kế hệ thống kháng cáo (UserAppeal) có lịch sử riêng biệt, cho phép upload minh chứng không cần đăng nhập và thu hồi session của hacker tức thì trên Redis. | Cấu trúc bảng user_appeals, logic invalidation session trong SessionRegistryListener, gửi thông báo khóa qua WebSocket và dựng giao diện LockOverlay. | Có | SystemAdminService.java, LockOverlay.jsx |
| 16 | 29/06/2026 | Gemini | Thiết kế Dashboard quản lý Mentor & Thu hồi (Revoke) | Thiết kế API thu hồi quyền Mentor, hạ cấp xuống USER, dọn dẹp file Cloudinary vật lý và gửi thông báo WebSocket realtime kết hợp API SSE rẽ nhánh. | Mã nguồn hàm revokeRequest, API stream SSE độc lập và chèn trường đếm classroomCount của Mentor. | Có | MentorVerificationServiceImpl.java, MentorVerificationController.java |

---

## 5. Prompt chi tiết

> Sinh viên/nhóm có thể nhân bản mẫu “Prompt số...” nhiều lần tùy số lượng prompt thực tế đã sử dụng.

---

### Prompt số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 15/05/2026 |
| Công cụ AI | ChatGPT / Gemini |
| Mục đích | Triển khai Đăng ký tài khoản 2 bước (OTP + Redis) |
| Phần việc liên quan | Backend / Security / Database |
| Mức độ sử dụng | Hỏi sinh code / Thiết kế kiến trúc |

#### 5.1. Prompt nguyên văn

```text
Hãy đóng vai là một Senior Backend Developer chuyên nghiệp về Java Spring Boot. Tôi cần bạn thiết kế và triển khai hoàn chỉnh tính năng "Đăng ký tài khoản 2 bước bằng REST API (gửi OTP qua Email xác thực và sử dụng Redis làm bộ nhớ đệm)" cho một dự án Spring Boot 3.x / 4.x (Java 21), sử dụng PostgreSQL làm Database và Flyway để quản lý database migration.

Dưới đây là thông tin chi tiết về Database, Kiến trúc, API Spec và các bước bạn cần thực hiện:
1. THÔNG TIN DATABASE SCHEMA (Dựa trên Flyway SQL)
Chúng ta có 3 bảng liên quan đến Authentication và User Profile:
A. Bảng system_roles (Vai trò hệ thống):
   - id: BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY
   - name: VARCHAR(50) NOT NULL UNIQUE (Ví dụ: 'USER', 'ADMIN', 'MENTOR')
   - description: VARCHAR(255)
B. Bảng user_accounts (Tài khoản người dùng):
   - id: BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY
   - username: VARCHAR(50) NOT NULL UNIQUE
   - email: VARCHAR(255) NOT NULL UNIQUE
   - password_hash: VARCHAR NOT NULL (lưu mật khẩu đã băm bằng BCrypt)
   - system_role_id: BIGINT NOT NULL (Foreign Key liên kết đến system_roles.id)
   - is_active: BOOLEAN NOT NULL DEFAULT TRUE
   - created_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   - updated_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
C. Bảng user_profiles (Hồ sơ người dùng):
   - id: BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY
   - user_id: BIGINT NOT NULL UNIQUE (Foreign Key liên kết đến user_accounts.id, ON DELETE CASCADE)
   - full_name: VARCHAR(100)
   - avatar_url: VARCHAR
   - bio: TEXT
   - phone: VARCHAR(20)
   - updated_at: TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

*Mối quan hệ JPA Entity*:
- UserAccount có mối quan hệ Many-to-One với SystemRole.
- UserAccount có mối quan hệ One-to-One song phương với UserProfile (cascade = CascadeType.ALL, orphanRemoval = true).
2. CÁC DEPENDENCIES THAM GIA (Maven pom.xml)
Dự án đã nạp sẵn các dependencies sau:
- spring-boot-starter-data-jpa
- spring-boot-starter-security
- spring-boot-starter-validation
- spring-boot-starter-mail
- spring-boot-starter-data-redis
- lombok
- postgresql (driver)
3. QUY TRÌNH ĐĂNG KÝ 2 BƯỚC (REST API WORKFLOW)
Bước 1: Yêu cầu Đăng ký (Request Registration)
- User gửi payload đăng ký (username, email, password, fullName, phone) lên endpoint:
  POST /api/v1/auth/register/request
- Backend thực hiện:
  1. Kiểm tra Validate định dạng đầu vào (email hợp lệ, mật khẩu đủ độ dài...).
  2. Kiểm tra xem username hoặc email đã tồn tại trong bảng user_accounts chưa. Nếu rồi, ném lỗi Bad Request (400) hoặc Conflict (409).
  3. Sinh mã OTP ngẫu nhiên 6 chữ số.
  4. Lưu thông tin DTO đăng ký tạm thời (Registration DTO) và mã OTP vào Redis với thời gian sống (TTL) là 5 phút.
     - Key lưu OTP: OTP:<email>
     - Key lưu DTO: REG:<email>
  5. Gửi email chứa mã OTP dưới dạng HTML đẹp mắt đến email của người dùng bằng JavaMailSender.
  6. Trả về Response JSON thông báo thành công: "Mã OTP đã được gửi đến email của bạn. Vui lòng xác thực trong vòng 5 phút."
Bước 2: Xác thực OTP & Hoàn tất Đăng ký (Verify OTP & Complete Registration)
- User gửi email và mã OTP lên endpoint:
  POST /api/v1/auth/register/verify
- Backend thực hiện:
  1. Kiểm tra mã OTP gửi lên có khớp với mã OTP lưu trong Redis của email đó hay không. Nếu không khớp hoặc hết hạn, trả về lỗi 400 (Bad Request).
  2. Lấy dữ liệu Registration DTO tạm thời từ Redis dựa vào email. Nếu không tìm thấy, báo lỗi quá hạn.
  3. Tạo mới bản ghi UserAccount:
     - Gán username, email.
     - Mã hóa password bằng BCryptPasswordEncoder để gán vào password_hash.
     - Tìm kiếm SystemRole có tên mặc định là 'USER' (hoặc nạp từ hệ thống) để gán làm system_role_id.
     - Đặt is_active = true.
  4. Tạo mới bản ghi UserProfile tương ứng, liên kết với UserAccount vừa tạo và điền các trường full_name, phone.
  5. Lưu UserAccount (tự động cascade lưu UserProfile) xuống PostgreSQL thông qua JPA.
  6. Xóa bỏ hoàn toàn dữ liệu tạm của OTP và DTO đăng ký trên Redis để dọn dẹp bộ nhớ.
  7. Trả về thông tin User đã đăng ký thành công dưới dạng JSON (loại bỏ trường password_hash để bảo mật).
4. YÊU CẦU LẬP TRÌNH (BẠN HÃY THỰC HIỆN CÁC FILE SAU)
Hãy viết mã nguồn Java chuẩn chỉnh, đầy đủ cấu trúc, sử dụng các Best Practices (như Global Exception Handling, DTOs, Lombok, Transactional, ResponseEntity):
1. Entities: SystemRole.java, UserAccount.java, UserProfile.java
2. DTOs: RegisterRequest.java, VerifyOtpRequest.java, UserResponse.java, ApiResponse.java
3. Repositories: SystemRoleRepository.java, UserAccountRepository.java, UserProfileRepository.java
4. Services & Implementations: OtpService.java & OtpServiceImpl.java, EmailService.java & EmailServiceImpl.java, AuthService.java & AuthServiceImpl.java
5. Controllers: AuthController.java
6. Exception Handling & Security Config
```

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống cần cung cấp luồng đăng ký tài khoản bảo mật bằng cơ chế OTP qua Email và lưu trữ tạm thời các thông tin đăng ký vào Redis đệm trước khi lưu vào database PostgreSQL chính thức.
```

#### 5.3. Kết quả AI trả về

```text
AI đã đề xuất một plan chi tiết với cấu trúc thư mục sạch sẽ (DTO, Controller, Service, Config) và tự động tạo DataInitializer nạp các SystemRole mặc định lúc khởi chạy ứng dụng.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng toàn bộ cấu trúc các lớp Java (AuthService, EmailService, OtpService, SecurityConfig) để xử lý đăng ký 2 bước và gửi email OTP.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự thiết kế lại SecurityConfig để tiêm dependency injection đúng chuẩn Spring REST API thay vì Spring MVC truyền thống, tự cấu hình bean ObjectMapper và phân quyền endpoint permitAll.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã cung cấp chi tiết Database Schema, DTOs, API Spec và workflow 2 bước)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: Các file Entity, DTO, Service do AI sinh đều phù hợp với nghiệp vụ đăng ký 2 bước)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI đã tạo ra mã nguồn Spring Boot hoàn chỉnh ngay từ lần đầu hỏi)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Mã nguồn chạy đúng logic, chỉ cần cấu hình lại SecurityConfig cho phù hợp chuẩn REST API)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | 578de92 |
| File liên quan | AuthController.java, OtpServiceImpl.java, SecurityConfig.java |
| Kết quả chạy/test | Đăng ký gửi OTP thành công và xác thực lưu DB thành công |

#### 5.8. Ghi chú thêm

```text
Hệ thống chạy mượt mà, tuy nhiên cần bổ sung thêm validation kiểm tra regex các trường email và username trên Frontend để giảm tải cho Backend.
```

---

### Prompt số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 16/05/2026 |
| Công cụ AI | ChatGPT |
| Mục đích | Lưu nháp form đăng ký (Form State Persistence) |
| Phần việc liên quan | Frontend |
| Mức độ sử dụng | Hỏi sinh code / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
Tôi muốn bạn thiết kế một giải pháp JavaScript (Vanilla JS) chuyên nghiệp và tối ưu nhất để tự động lưu trạng thái form nhập liệu (Form State Persistence) nhằm chống mất dữ liệu khi người dùng vô tình bấm F5 (refresh), chuyển hướng trang, hoặc quay lại (back/forward) trong cùng một tab trình duyệt.

Yêu cầu giải pháp phải tuân thủ nghiêm ngặt các tiêu chuẩn kỹ thuật cấp độ Production dưới đây:
1. Cơ chế Lưu trữ & Phạm vi: sessionStorage.
2. Bảo mật tuyệt đối: Không lưu các trường nhạy cảm như Mật khẩu, OTP.
3. Tối ưu Hiệu suất: Dùng Event Delegation, tránh Global Scope Pollution.
4. Khôi phục thông minh (Smart Hydration): Chỉ khôi phục khi ô trống.
5. Tự động dọn dẹp (Self-Cleaning): Xóa sessionStorage khi submit thành công.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Tránh việc người dùng mất toàn bộ thông tin đã gõ trong form đăng ký khi lỡ bấm F5 hoặc chuyển trang trên Frontend.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất một file script helper JavaScript độc lập (formPersister.js) sử dụng IIFE và cơ chế sessionStorage để lưu nháp và hydrate dữ liệu DOM thủ công.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tái sử dụng ý tưởng lưu sessionStorage và cơ chế dọn dẹp nháp khi hoàn thành đăng ký.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Do React sử dụng Controlled Components, việc can thiệp trực tiếp vào DOM của AI bị React State ghi đè. Nhóm đã tự viết React Hooks (useEffect) trong RegisterPage.jsx để đồng bộ hóa nháp từ sessionStorage trực tiếp vào setFormData.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã nêu đủ yêu cầu sessionStorage, loại trừ password/OTP, IIFE, event delegation)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI đã tạo đúng module persister theo chuẩn Vanilla JS được yêu cầu)
- [x] Cần hỏi lại AI nhiều lần (Do phải tinh chỉnh và hỏi thêm để giải quyết sự xung đột với React Controlled Components)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Code DOM thô do AI đề xuất không tương thích với cơ chế Controlled Components của React, bị React State ghi đè khi F5)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | RegisterPage.jsx, formPersister.js |
| Kết quả chạy/test | Dữ liệu form đăng ký được giữ lại sau khi bấm F5 và biến mất khi tắt tab |

#### 5.8. Ghi chú thêm

```text
Cần lưu ý đặc tính Controlled Components của React khi làm việc với các thư viện can thiệp DOM trực tiếp.
```

---

### Prompt số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 17/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Phân trang danh sách dự án |
| Phần việc liên quan | Backend / Database |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi sinh code |

#### 5.1. Prompt nguyên văn

```text
Hãy đóng vai là một Senior Backend Developer chuyên nghiệp về Java Spring Boot và Database Administrator chuyên sâu về PostgreSQL. Tôi đang xây dựng tính năng phân trang danh sách dự án cho người dùng có lọc theo trạng thái (status) và tìm kiếm theo tên dự án (name).

Dưới đây là bối cảnh và yêu cầu chi tiết để bạn triển khai giải pháp tối ưu:
1. BỐI CẢNH DATABASE & FRAMEWORK: Spring Boot 3.x, Spring Data JPA, PostgreSQL. Lọc status (custom ENUM) và search name. Phân trang 15 bản ghi/trang dưới database.
2. YÊU CẦU LẬP TRÌNH: DTO PaginatedResponse phẳng trả về hasMore. Dùng Pageable, sắp xếp OVERDUE lên trước, COMPLETED xuống cuối. Tránh N+1 Query.
3. RÀNG BUỘC NGHIÊM NGẶT: Tránh lỗi ép kiểu PostgreSQL khi status/search là null. Không dùng query gộp (:status IS NULL OR p.status = :status) do PostgreSQL báo lỗi operator does not exist.
GIẢI PHÁP: Triển khai 4 phương thức truy vấn độc lập trong Repository và rẽ nhánh if-else ở Service.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Tính năng danh sách dự án có số lượng dòng lớn cần phân trang tối ưu hiệu năng dưới Database PostgreSQL, đồng thời giải quyết các lỗi ép kiểu nghiêm trọng của PostgreSQL đối với các tham số Null.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất tạo DTO PaginatedResponse phẳng chứa danh sách và cờ hasMore, cấu hình @BatchSize chống N+1 và hướng dẫn Invalidate cache của IDE khi bị lỗi biên dịch ảo.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng DTO PaginatedResponse, cơ chế phân trang Pageable và cấu hình @BatchSize(size = 20) trên các liên kết JPA.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Từ chối cách viết query gộp có NULL check của AI vì PostgreSQL lỗi. Nhóm đã tự cấu trúc lại ProjectRepository thành 4 hàm query chuyên biệt độc lập và xử lý rẽ nhánh logic if-else sạch sẽ ở ProjectServiceImpl.java.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã cung cấp đầy đủ thông tin về DB, Pageable, Custom Enum status và search keyword)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: Đã đề xuất đúng PaginatedResponse DTO phẳng và cấu hình JPA để phân trang)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: Gemini giải quyết đúng mục tiêu cấu hình BatchSize và phân trang sau 1 lần hỏi)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: AI đề xuất query gộp chứa NULL check gây ra lỗi operator does not exist và lower(bytea) does not exist của PostgreSQL)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | ProjectServiceImpl.java, ProjectRepository.java |
| Kết quả chạy/test | Phân trang chạy mượt mà, không gặp lỗi cast enum PostgreSQL |

#### 5.8. Ghi chú thêm

```text
PostgreSQL cực kỳ khắt khe về kiểu dữ liệu. Việc tách rời các kịch bản truy vấn giúp tối ưu hóa câu lệnh SQL và tránh các lỗi runtime.
```

---

### Prompt số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 18/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Tìm giải pháp chống Brute Force và tối ưu UX/Hiệu năng |
| Phần việc liên quan | Security / Backend / Frontend |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi giải thích / Thiết kế kiến trúc |

#### 5.1. Prompt nguyên văn

```text
Tôi đang làm trang đăng nhập. Tôi muốn thêm cơ chế chống brute force để bảo vệ tài khoản người dùng khỏi việc bị dò mật khẩu. Bạn có phương án nào đơn giản không?
...
Khoan đã. Nếu tôi dùng khóa theo IP, vậy nếu công ty tôi có 100 nhân viên dùng chung một mạng Wi-Fi (chung 1 IP Public/NAT), một người gõ sai 5 lần thì 99 người còn lại cũng không đăng nhập được à? Hơn nữa, việc cứ mỗi lần gõ sai lại update vào Database SQL thì lúc bị tấn công thật, Database của tôi sập trước khi hacker từ bỏ sao?
...
Oke, dùng Redis và khóa theo Account là hợp lý. Nhưng khi tài khoản bị khóa, giao diện nó cứ đứng yên rồi báo lỗi 'Unauthorized' chung chung thì UX rất tệ. Tôi muốn khi bị khóa, backend trả về mã lỗi riêng, và giao diện hiện thông báo: 'Tài khoản tạm khóa, thử lại sau X phút'. Làm sao tối ưu luồng xử lý này ở Backend?
```

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống cần bảo vệ chống đăng nhập sai nhiều lần, nhưng phải đảm bảo không ảnh hưởng người dùng chung mạng NAT và không làm chết Database do truy vấn liên tục.
```

#### 5.3. Kết quả AI trả về

```text
AI ban đầu đề xuất khóa IP, sau khi bị phản biện đã chuyển sang Khóa lũy tiến theo Tài khoản (Progressive Lockout) trên Redis. Cuối cùng thống nhất kiến trúc Fast-Fail: ngắt mạch ngay tại Redis trả về lỗi 423 Locked trước khi truy vấn DB.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng toàn bộ kiến trúc Fast-Fail và Progressive Lockout trên Redis. Tích hợp mã lỗi 423 Locked trả về UI.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự thiết kế thêm thanh đếm ngược thời gian bên Frontend dựa trên số giây còn lại (TTL) do Backend trả về, giúp tối ưu trải nghiệm người dùng.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Cung cấp đầy đủ bối cảnh về việc đăng nhập sai và rủi ro DoS Database)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI đề xuất đúng giải pháp Progressive Lockout + Fast-Fail bằng Redis sau phản biện)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: Chỉ cần qua 1 lượt phản biện để làm rõ vấn đề mạng NAT và DoS)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều (phản biện lại AI)
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Đề xuất ban đầu dùng IP Blocking bị từ chối do ảnh hưởng người dùng chung mạng NAT và gây DoS Database)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit | 8d340e6 |
| File liên quan | AuthServiceImpl.java |

#### 5.8. Ghi chú thêm

```text
Việc phản biện lại AI giúp tìm ra giải pháp tốt hơn rất nhiều so với đề xuất ban đầu.
```

---

### Prompt số 5

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 19/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Thiết kế cơ chế Khóa Kép Đa IP và Action Link qua Email |
| Phần việc liên quan | Security / Backend / Email Service |
| Mức độ sử dụng | Hỏi ý tưởng / Lên kiến trúc / Sinh mã nguồn |

#### 5.1. Prompt nguyên văn

```text
Oke, nếu như là IP thứ 2 trong vòng 1 ngày mà đăng nhập sai liên tục như thế thì mới khóa toàn bộ tài khoản (kể cả người dùng thật), và lúc này có thể khẳng định là đang bị tấn công. Vậy thì lúc này mới gửi mail cảnh báo về thì có hợp lí không? 
Vấn đề là IP chỉ là một con số, làm sao phân biệt được 2 IP đó? Có thể hiện địa chỉ trực quan được không, ví dụ 'Macbook - Hà Nội, Việt Nam' kiểu thế?
Và tôi muốn áp dụng biện pháp: Phân biệt nút bấm riêng cho từng IP trong Email. Trong Email cảnh báo, liệt kê danh sách các thiết bị lỗi kèm theo đường link whitelist riêng biệt:
- Thiết bị 1: MacBook Pro - Hà Nội 👉 [Xác nhận Thiết bị này của tôi]
- Thiết bị 2: Linux Server - Nga 👉 [Thiết bị lạ (Chặn IP này)]
Khi click vào nút của Thiết bị 1, server sẽ whitelist IP đó. Bạn hãy thực hiện ở phía backend sao cho code chuẩn, các hàm có tính reuse cao.
...
Khoan, vai tôi dùng điện thoại (iPhone) đăng nhập mà sao nó hiện cảnh báo là Macbook???
```

#### 5.2. Bối cảnh khi viết prompt

```text
Hệ thống cần phân biệt giữa người dùng thật gõ sai mật khẩu và Botnet tấn công từ nhiều IP khác nhau. Cần gửi email chứa thông tin thiết bị trực quan để người dùng tự mở khóa IP của mình.
```

#### 5.3. Kết quả AI trả về

```text
AI thiết kế hệ thống Khóa Kép (Double-Lockout). Tích hợp API GeoIP và phân tích User-Agent để lấy tên thiết bị + vị trí. Thiết kế Action Link bằng Secure Token. Về lỗi nhận diện sai iPhone thành Macbook, AI giải thích do tính năng 'Request Desktop Website' mặc định của iOS 13+ làm sai lệch User-Agent và hướng dẫn cách khắc phục.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng thành công cơ chế Khóa toàn cầu khi có >= 2 IP tấn công, tích hợp GeoIP, và gửi Email chứa nút Action Link (Whitelist/Blacklist).
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Hướng dẫn người dùng tắt chế độ 'Yêu cầu trang web máy tính' trên Safari di động để hệ thống nhận diện chính xác thiết bị. Căn chỉnh lại giao diện Email Template cho các nút bấm rõ ràng hơn.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã cung cấp đầy đủ các kịch bản khóa IP, thiết bị, và yêu cầu email whitelist/blacklist)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: Giải pháp thiết kế Khóa kép và Action Link qua Email rất chính xác)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI giải thích cặn kẽ và cung cấp mã nguồn hoàn chỉnh ngay)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều (phản biện lại AI)
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Nhận diện sai iPhone thành Macbook do thuộc tính Request Desktop Website của iOS, cần hướng dẫn người dùng cấu hình trình duyệt di động)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | EmailServiceImpl.java, AuthServiceImpl.java |

#### 5.8. Ghi chú thêm

```text
Việc AI phát hiện ra đặc tả ẩn của Apple iOS (thay đổi User-Agent) giúp tiết kiệm rất nhiều thời gian debug.
```

---

### Prompt số 6

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 19/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Thiết kế cơ chế Reset Trạng Thái Bảo Mật (Security State Reset) thông minh |
| Phần việc liên quan | Security / Backend / Redis |
| Mức độ sử dụng | Hỏi ý tưởng / Giải quyết luồng logic |

#### 6.1. Prompt nguyên văn

```text
Một vấn đề nữa là 1 máy đăng nhập sai nhưng máy kia đăng nhập vào mà nó không reset. Tôi đăng xuất phát xong log sai 1 lần thì nó lại khóa luôn.
...
Tức là ở đây khi chủ tài khoản đăng nhập thành công vào hệ thống đang bị khóa một phần, thì máy hacker có bị xóa đếm lỗi không hay xóa hết tất cả?
```

#### 6.2. Bối cảnh khi viết prompt

```text
Khi một tài khoản bị tấn công từ xa, đếm lỗi trên Redis tăng lên. Nhưng khi người dùng thực (chủ tài khoản) đăng nhập thành công từ IP an toàn, hệ thống chưa dọn dẹp các bộ đếm lỗi cũ, dẫn đến việc chủ tài khoản dễ bị khóa oan ở lần đăng nhập sau. Cần có cơ chế reset nhưng phải đảm bảo không mở khóa cho hacker.
```

#### 6.3. Kết quả AI trả về

```text
AI đề xuất cơ chế "Dọn dẹp bảo mật thông minh" (Full Security State Reset). Khi đăng nhập thành công, hệ thống chỉ gọi hàm `clearFailureCount(ipAddress)` cho IP của người dùng thật. Hacker ở IP khác vẫn bị cô lập và giữ nguyên trạng thái khóa 30 phút.
```

#### 6.4. Kết quả đã áp dụng vào bài

```text
Thêm logic dọn dẹp bảo mật vào khối đăng nhập thành công trong `AuthServiceImpl.java`, đảm bảo các IP độc hại tiếp tục bị khóa cứng.
```

#### 6.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Cấu trúc lại Redis Hash để lưu trữ trạng thái khóa của từng IP riêng biệt thay vì dùng 1 key chung cho toàn bộ tài khoản, giúp việc xóa field trong Hash chính xác và an toàn.
```

#### 6.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã nêu rõ hành vi đăng nhập sai của hacker và hành vi đăng nhập thành công của người dùng thật)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: Cơ chế Security State Reset đề xuất rất thông minh)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI hiểu rõ nghiệp vụ cô lập hacker sau khi được chỉ rõ kịch bản)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Logic ban đầu của AI xóa toàn bộ Key đếm lỗi trên Redis sẽ vô tình mở khóa cho hacker, cần chuyển sang Redis Hash để xóa theo IP)

#### 6.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | AuthServiceImpl.java |

#### 6.8. Ghi chú thêm

```text
Sự rõ ràng trong việc yêu cầu "Cô lập hacker" giúp AI thiết kế chính xác luồng xử lý trên Redis Hash.
```

---

### Prompt số 7

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 20/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Bảo mật Token GitHub (OAuth 2.0) & Xử lý vòng đời Token |
| Phần việc liên quan | Security / Integration / Database |
| Mức độ sử dụng | Hỏi ý tưởng / Lên kiến trúc |

#### 7.1. Prompt nguyên văn

```text
[Lần 1 - Tôi]: Trước đây tôi sử dụng PAT (Personal Access Token) để gọi API GitHub, nhưng do rủi ro lộ quyền (Full Access) nên tôi quyết định refactor chuyển sang luồng OAuth 2.0 (GitHub App). Hãy viết code xử lý lưu Access Token từ GitHub về Database.
[AI trả về]: Cung cấp đoạn code Entity và Service lưu trực tiếp token dưới dạng chuỗi (plain-text) vào cột `github_token`.

[Lần 2 - Tôi phản biện]: Cách làm của bạn quá sơ sài và rủi ro về bảo mật! Nếu Database bị dump thì toàn bộ token của người dùng bị lộ hết à? Tôi không chấp nhận lưu plain-text. Hãy đề xuất cơ chế mã hóa 2 chiều mạnh mẽ, và tuyệt đối không được hardcode chìa khóa mã hóa (Secret Key) trong source code. 
Ngoài ra, khi backend dùng token này gọi API GitHub, nếu bị trả về 401 Unauthorized (token hết hạn/thu hồi) thì xử lý thế nào? Lưu ý: Tuyệt đối không ghi log giá trị của Token ra màn hình console hay file log dưới mọi hình thức!
```

#### 7.2. Bối cảnh khi viết prompt

```text
Quá trình chuyển đổi từ PAT sang OAuth 2.0 đòi hỏi tiêu chuẩn bảo mật khắt khe hơn. Các mô hình LLM ban đầu thường lười biếng và sinh ra các giải pháp CRUD cơ bản (lưu token dạng plain-text). Việc phản biện thẳng thắn là cần thiết để ép AI áp dụng Encryption và thiết kế quy trình vòng đời Token (Token Lifecycle) an toàn.
```

#### 7.3. Kết quả AI trả về

```text
Sau khi bị phản biện, AI nhận lỗi và đề xuất thuật toán mã hóa đối xứng AES-256. Khóa mã hóa được trích xuất ra biến môi trường. AI bổ sung một `RestTemplate Interceptor` để catch lỗi 401: tự động hủy liên kết tài khoản (Unlink), không bao giờ log nội dung Token, chỉ log hành động "Đã cập nhật khóa AES" hoặc "Lỗi 401 - Đã Unlink".
```

#### 7.4. Kết quả đã áp dụng vào bài

```text
Cấu trúc Database được bảo vệ hoàn toàn khỏi rủi ro lộ lọt Token. Luồng bắt lỗi 401 hoạt động tốt, tự động yêu cầu người dùng xác thực lại OAuth khi cần thiết.
```

#### 7.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tích hợp thêm hệ thống Secret Manager cục bộ để quản lý các biến môi trường mã hóa một cách đồng bộ trong quá trình deploy.
```

#### 7.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã cung cấp rõ bối cảnh chuyển từ PAT sang OAuth 2.0 và yêu cầu mã hóa)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI cung cấp đúng mã hóa AES-256 sau khi được phản biện)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI tiếp nhận ý kiến phản biện nhanh chóng và sửa đổi chính xác)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Gợi ý ban đầu của AI lưu token plain-text vi phạm quy định bảo mật)

#### 7.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | GithubIntegrationService.java, OAuthSecurityConfig.java |

#### 7.8. Ghi chú thêm

```text
Sự kiên quyết trong phản biện "Không chấp nhận lưu plain-text" đã ép AI chuyển từ tư duy của Junior Coder sang tư duy của Security Engineer.
```

---

### Prompt số 8

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 20/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Đồng bộ GitHub Issues qua Webhook & Ràng buộc Review Gate |
| Phần việc liên quan | Webhook / Business Logic / State Machine |
| Mức độ sử dụng | Phản biện logic / Ép AI làm theo Domain Knowledge |

#### 8.1. Prompt nguyên văn

```text
[Lần 1 - Tôi]: Tôi cần làm chức năng người dùng ấn hoàn thành Task. Hãy viết API cập nhật trạng thái Task thành DONE và đồng bộ lên Github Issue qua Webhook.
[AI trả về]: Cung cấp hàm `updateTaskStatus(taskId, DONE)`, thực hiện đổi trạng thái và lưu DB thẳng tuột.

[Lần 2 - Tôi phản biện]: Logic nghiệp vụ của bạn sai hoàn toàn! App của tôi có quy trình duyệt Task (Review Gate). User không được phép nhảy cóc thẳng từ IN_PROGRESS sang DONE mà bắt buộc phải qua bước IN_REVIEW để Mentor duyệt. Bạn viết code CRUD như vậy thì user chỉ cần dùng Postman bắn API là tự bypass được à? 
Yêu cầu: Hãy viết một State Machine (Máy trạng thái) kiểm soát chặt chẽ ở tầng Service. Chặn đứng các hành vi vượt rào bằng ngoại lệ HTTP 400 Bad Request, đồng thời phải ghi log cảnh báo (WARN) "Cố tình vượt rào duyệt task" kèm IP của user!
```

#### 8.2. Bối cảnh khi viết prompt

```text
Tính năng đồng bộ GitHub Webhook gặp vấn đề lớn về "Bypass" nghiệp vụ. AI chỉ cung cấp luồng CRUD thông thường bỏ qua hoàn toàn "Review Gate" của dự án (luật: phải có Mentor approve). Đây là điểm yếu cố hữu của LLM khi không nắm bắt được Domain Knowledge đặc thù nếu không bị ép.
```

#### 8.3. Kết quả AI trả về

```text
Nhận được sự phản biện gay gắt, AI đã cấu trúc lại toàn bộ tầng `TaskServiceImpl.java` thành một State Machine. Thêm các câu lệnh kiểm tra: `if (newStatus == DONE && oldStatus != IN_REVIEW)` hoặc thiếu cờ `mentorApproved`, lập tức `throw new BadRequestException()`. Đồng thời, AI thiết lập Logger ở mức WARN ghi lại địa chỉ IP của request có dấu hiệu bypass.
```

#### 8.4. Kết quả đã áp dụng vào bài

```text
Hệ thống nay đã miễn nhiễm với các công cụ gọi API tự động (Postman/Curl) cố tình ép trạng thái Task. Webhook rác từ GitHub cũng được cấu hình Fast-Fail theo gợi ý bổ sung của AI.
```

#### 8.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Bổ sung thêm log truy vết (Traceability): Ghi rõ URL của GitHub Issue được tạo thành công để liên kết 1-1 với ID của Task trên Backend, giúp dễ dàng debug chéo giữa 2 nền tảng.
```

#### 8.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã cung cấp đầy đủ workflow cập nhật Task và đồng bộ GitHub Issue Webhook)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI triển khai chính xác State Machine kiểm soát Task và log cảnh báo)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI chuyển hướng giải pháp nhanh và đúng hướng ngay sau phản biện)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: AI ban đầu sinh API cập nhật Task dạng CRUD tự do, bỏ qua hoàn toàn quy trình Review Gate của dự án)

#### 8.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | TaskServiceImpl.java, GithubWebhookController.java |

#### 8.8. Ghi chú thêm

```text
Sự phản biện mạnh mẽ và việc đặt mình vào vị trí "Domain Expert" là bắt buộc để LLM không phá hỏng Business Logic của dự án.
```

---

### Prompt số 9

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 22/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Cơ chế an toàn Classroom: Chống IDOR, Token AES link mời, Chia nhóm Hybrid, Khóa Redis |
| Phần việc liên quan | Backend / Security / Database |
| Mức độ sử dụng | Hỏi sinh code / Tối ưu giải pháp |

#### 5.1. Prompt nguyên văn

```text
[Em - Lần 1]: Em đang thiết kế API Classroom. Cần làm API getClassroomById và tính năng sinh link mời học sinh join lớp.
[AI Lần 1]: Trả về code JPA tìm kiếm thẳng theo ID lớp và trả về Object. Link mời được sinh dưới dạng /join?classroomId=123.

// Suy nghĩ của em: 
// Cách này quá nguy hiểm. Nếu học sinh tò mò tự thay đổi ID (ví dụ từ 123 thành 124) trên URL thì họ có thể xem trộm thông tin các lớp học khác (lỗi IDOR). Hơn nữa, link mời để dạng plain-text ID thế này thì ai cũng có thể đoán và tự ý chui vào lớp. 
// Em định dùng JWT để ký và đặt hạn sử dụng cho link mời để tăng tính bảo mật.
[Em - Lần 2 (Phản biện & Thiết kế bảo mật)]: 
1. IDOR: Hệ thống đã có JWT để xác thực danh tính (Authentication), nhưng nếu chỉ xác thực mà không ràng buộc quyền truy cập (Authorization) ở Service, một học sinh có JWT hợp lệ vẫn có thể thay đổi số ID ngẫu nhiên trên URL để xem trộm thông tin các lớp học khác. Hãy sửa lại code sao cho chỉ owner (mentor tạo lớp) hoặc học sinh đã join lớp đó (trong danh sách enrolledStudents) mới có quyền xem chi tiết lớp học.
2. Link mời dạng plain-text ID: Học sinh khác chỉ cần đoán ID là có thể tự ý join vào bất kỳ lớp học nào. Em từng nghĩ đến việc dùng JWT để ký và mã hóa link mời này để có thời hạn hết hạn. Hãy đề xuất giải pháp JWT hoặc phương án mã hóa đối xứng AES-128 an toàn nhẹ hơn để che giấu ID lớp và thời gian sinh link. Hãy viết helper ClassroomTokenUtil cho tôi.
[AI Lần 2]: Đồng ý check isOwner và isEnrolled để chặn IDOR. Về link mời, AI khuyên dùng AES-128 vì JWT đòi hỏi thư viện cồng kềnh, cấu hình khóa công khai/bí mật phức tạp hơn. AES-128 mã hóa chuỗi "classroomId|timestamp" và encode Base64 Url Safe sẽ gọn nhẹ và bảo mật tuyệt đối cho bài này. AI đã viết ClassroomTokenUtil sử dụng Java Cryptography.

// Suy nghĩ của em:
// Tiếp theo là tính năng chia nhóm ngẫu nhiên (randomGroups) cho Mentor. 
// AI thường sẽ sinh thuật toán trộn cả lớp rồi chia từ đầu. Nhưng trong thực tế, các nhóm đang làm việc ổn định thì không được phép phá hỏng. 
// Em cần một thuật toán lai (Hybrid): chỉ gom học sinh chưa có nhóm, trộn ngẫu nhiên, rồi điền vào các chỗ trống của các nhóm đang có trước cho lấp đầy thành viên (membersPerGroup), sau đó học sinh nào còn thừa mới tạo nhóm mới.
[Em - Lần 3 (Thiết kế thuật toán chia nhóm Hybrid)]:
Bây giờ viết chức năng randomGroups. Yêu cầu nghiệp vụ đặc thù: Không được xáo trộn các nhóm đang chạy. Bạn phải lấy danh sách học sinh chưa có nhóm (unassigned), shuffle ngẫu nhiên, sau đó duyệt qua các project đang hoạt động để điền (fill) cho đủ thành viên tối đa (membersPerGroup). Nếu điền hết rồi mà học sinh vẫn thừa thì mới sinh thêm project mới cho họ.
[AI Lần 3]: Trả về logic chia nhóm dạng lai: Duyệt qua các project, lấy kích thước nhóm hiện tại, so sánh với membersPerGroup, chèn học sinh từ danh sách unassigned vào và save. Sau đó tạo project mới với các học sinh còn lại.

// Suy nghĩ của em:
// Cuối cùng là vấn đề concurrency ở hàm joinClassroom.
// Khi link mời được gửi lên nhóm lớp chat, hàng chục học sinh cùng click join cùng lúc. Các luồng xử lý song song sẽ cùng đọc DB, thấy lớp còn chỗ (ví dụ đang có 49 người, max là 50), thế là cả 2 luồng đều cho học sinh join, dẫn đến số lượng vượt quá maxMembers thành 51.
// Em định dùng từ khóa synchronized của Java nhưng chợt nhớ ra dự án chạy trên server phân tán thì synchronized mất tác dụng.
[Em - Lần 4 (Concurrency Control bằng Khóa phân tán Redis)]:
Khi hàng chục học sinh click link join lớp cùng lúc, hệ thống sẽ gặp race condition làm số thành viên vượt quá maxMembers. Nếu em dùng từ khóa `synchronized` của Java để khóa hàm joinClassroom thì có ổn không? Dự án có cấu hình Redis, em có nên dùng khóa phân tán Redis không? Hãy viết code joinClassroom hoàn chỉnh cho tôi.
[AI Lần 4]: Giải thích synchronized chỉ khóa ở cấp độ đơn JVM, nếu deploy lên nhiều server hoặc cluster thì sẽ bị lọt. Vì dự án đã có Redis, sử dụng Redis Distributed Lock (SETNX / setIfAbsent với TTL 1s) là phương án tối ưu nhất. AI sinh code dùng StringRedisTemplate để lock theo classroomId, kiểm tra giới hạn maxMembers, thêm học sinh vào danh sách, và giải phóng lock ở khối finally.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Cải thiện tính bảo mật chống tấn công IDOR và đoán link tham gia lớp học, tối ưu quy trình chia nhóm ngẫu nhiên bảo lưu nhóm cũ của Mentor và chống race condition đa luồng khi học sinh cùng nhấn join lớp.
```

#### 5.3. Kết quả AI trả về

```text
AI tiếp thu phản biện và đề xuất giải pháp chi tiết:
1. IDOR: Bổ sung check logic kiểm tra isOwner và isEnrolled tại getClassroomById trước khi trả dữ liệu.
2. Link mời: So sánh JWT (nặng, tốn tài nguyên ký/giải mã) và đề xuất sử dụng mã hóa đối xứng AES-128 (đệm chuỗi classroomId + timestamp, mã hóa và encode Base64 Url Safe), tối ưu hơn cho link mời nội bộ.
3. Chia nhóm Hybrid: Thiết kế giải thuật tìm học sinh chưa gán nhóm, shuffle, duyệt qua các active projects để lấp đầy thành viên thiếu, sau đó mới chia số còn dư vào group mới.
4. Concurrency: Giải thích 'synchronized' của Java chỉ hoạt động trên đơn JVM, không giải quyết được trong môi trường cluster/phân tán. Đề xuất sử dụng Redis Distributed Lock (setIfAbsent) vì hệ thống đã cấu hình sẵn Redis.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng kiểm tra bảo mật IDOR, module mã hóa AES ClassroomTokenUtil.java, giải thuật chia nhóm ngẫu nhiên Hybrid và cơ chế khóa phân tán Redis cho joinClassroom.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Nhóm phát hiện lỗi bất đồng bộ nghiêm trọng: Nếu dùng @Transactional ở mức phương thức kết hợp khóa Redis giải phóng trong khối finally, lock Redis có thể bị nhả trước khi Database transaction thực sự commit (do transaction commit diễn ra sau khi phương thức kết thúc). Điều này khiến luồng khác nhảy vào đọc dữ liệu cũ ở DB, dẫn đến vượt quá giới hạn maxMembers. Nhóm đã tự sửa bằng cách loại bỏ @Transactional trên phương thức joinClassroom, bọc logic JPA bên trong TransactionTemplate thủ công và giải phóng lock Redis ở ngoài transaction boundary.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã cung cấp bối cảnh chi tiết về IDOR, JWT vs AES, Hybrid grouping và Concurrency)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI đề xuất hướng đi chính xác cho cả 4 khía cạnh nghiệp vụ và bảo mật)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI tiếp thu phản biện rất nhanh và sửa mã nguồn đúng hướng)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Gợi ý ban đầu của AI sinh link plain-text không bảo mật, dùng synchronized không chạy được phân tán, và dùng @Transactional chung với lock bị lỗi race condition)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | ClassroomServiceImpl.java, ClassroomTokenUtil.java, ClassroomServiceConcurrencyTest.java |
| Kết quả chạy/test | Đăng nhập song song 10 luồng join lớp giới hạn 5 người, kết quả chỉ có đúng 5 người vào thành công; link mời AES được giải mã chính xác; chia nhóm Hybrid chạy đúng nghiệp vụ. |

#### 5.8. Ghi chú thêm

```text
Việc tự đề xuất hướng đi "Hybrid" khi chia nhóm và phản biện lại ý tưởng dùng plain-text/synchronized giúp hệ thống đạt chuẩn thiết kế phần mềm doanh nghiệp thực tế.
```

---

### Prompt số 10

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 23/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Luật biểu quyết 2/3 nhóm (Voting Rules) cho Task & Proposal |
| Phần việc liên quan | Backend / Business Logic / GitHub Integration |
| Mức độ sử dụng | Hỏi sinh code / Tối ưu giải pháp |

#### 5.1. Prompt nguyên văn

```text
[Em - Lần 1]: Em đang làm tính năng phê duyệt Đề xuất Task (approveProposal) và đồng bộ lên GitHub (approveAndSyncTask) cho nhóm. Hãy viết API và logic Spring Boot cơ bản cho phép Leader hoặc người tạo đề xuất bấm duyệt là xong.
[AI Lần 1]: Sinh ra code kiểm tra xem user hiện tại gửi request có phải là Leader của Project hay là người tạo Proposal/Task không, nếu đúng thì chuyển status sang APPROVED và tiến hành gọi GitHub API để đồng bộ.

// Suy nghĩ của em:
// Nếu chỉ để Leader hoặc người tạo tự phê duyệt và đồng bộ lên GitHub thì quá lạm quyền và dễ gây sai lệch code. 
// Dự án của tụi em hướng tới tinh thần làm việc nhóm cao độ, nơi toàn bộ thành viên phải cùng có trách nhiệm với hệ thống và các Task của dự án. Không ai được phép tự ý thay đổi hoặc sync lên GitHub mà không có sự đồng thuận của tập thể.
// Do đó, em cần thiết lập một luật biểu quyết chặt chẽ: Bất kỳ Đề xuất hay Đồng bộ nào đều phải đạt trên 2/3 thành viên của nhóm tham gia biểu quyết (vote), và số lượng tán thành (upvote) phải lớn hơn phản đối (downvote) thì mới cho phép phê duyệt.
[Em - Lần 2 (Phản biện & Thiết kế Luật biểu quyết)]:
Quy trình phê duyệt này không đúng với tinh thần làm việc nhóm của em. Em muốn toàn bộ thành viên phải cùng có trách nhiệm với các quyết định đồng bộ task. 
Hãy sửa lại code cả ở approveProposal và approveAndSyncTask:
1. Kiểm tra tổng số thành viên của Project qua projectMemberRepository.
2. Đếm số lượt vote (tán thành/phản đối) của Proposal/Task.
3. Bắt buộc số lượng người tham gia vote phải đạt trên 2/3 tổng số thành viên nhóm.
4. Số lượt tán thành (upvote) phải lớn hơn phản đối (downvote). Nếu không đạt, ném CustomException (HTTP 400) thông báo rõ lỗi.
[AI Lần 2]: Đồng ý. AI đã sửa lại logic approveProposal và approveAndSyncTask. AI sử dụng các phép so sánh toán học an toàn (như 3 * totalVotes <= 2 * totalMembers để tránh lỗi chia số thực) và ném CustomException với thông báo chi tiết khi chưa đủ 2/3 số thành viên vote hoặc tán thành không chiếm đa số.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Ràng buộc nghiệp vụ biểu quyết tập thể cho phép phê duyệt và đồng bộ task lên GitHub nhằm đảm bảo toàn bộ thành viên nhóm cùng chia sẻ trách nhiệm quản trị hệ thống, ngăn chặn sự độc đoán hoặc lạm quyền.
```

#### 5.3. Kết quả AI trả về

```text
AI cung cấp logic lấy số lượng thành viên dự án, đếm vote của đề xuất và viết biểu thức so sánh 2/3 bằng số nguyên, trả về lỗi CustomException chi tiết khi điều kiện biểu quyết không thỏa mãn.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng cơ chế so sánh toán học tỉ lệ biểu quyết 2/3 và cơ chế kiểm soát ngoại lệ CustomException trên Service của backend.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự tối ưu thêm cơ chế ngắt sớm Fast-Fail: Nếu số lượt phản đối (downvote) của cả nhóm đã vượt quá 1/3 (tức là 3 * downvotes > 2 * totalMembers), hệ thống lập tức ném lỗi từ chối duyệt ngay lập tức mà không cần đợi đếm hết tất cả vote, giúp tăng tốc độ phản hồi và tiết kiệm tài nguyên database.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã cung cấp bối cảnh chi tiết về luật biểu quyết 2/3 và ý nghĩa trách nhiệm tập thể)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI đề xuất đúng phép toán so sánh tỉ lệ bằng số nguyên an toàn)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: Gemini giải quyết đúng kịch bản nghiệp vụ biểu quyết ngay)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Đề xuất ban đầu của AI cho phép Leader tự ý duyệt đơn phương vi phạm nguyên tắc trách nhiệm tập thể của nhóm)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | TaskProposalService.java |
| Kết quả chạy/test | Khi nhóm 5 người mới chỉ có 2 người vote, bấm Duyệt báo lỗi 400 Bad Request ngay. Khi có 4 người vote (đạt 2/3) và đa số upvote, hệ thống tự động sinh sub-task và sync GitHub thành công. |

#### 5.8. Ghi chú thêm

```text
Quy tắc so sánh tỷ lệ bằng số nguyên (3 * totalVotes <= 2 * totalMembers) giúp tránh được sai số dấu phẩy động trong lập trình.
```

---

### Prompt số 11

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 24/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | SSE realtime & Proxy Endpoint bảo vệ ảnh thẻ Mentor |
| Phần việc liên quan | Backend / Security / Real-time Notification / Private Storage |
| Mức độ sử dụng | Hỏi sinh code / Tối ưu giải pháp |

#### 5.1. Prompt nguyên văn

```text
[Em - Lần 1]: Em đang làm tính năng Mentor gửi yêu cầu xác thực tài khoản lên Admin. Khi có yêu cầu mới, Admin cần nhận được thông báo thời gian thực ngay lập tức. Em định dùng WebSockets cho realtime, và lưu ảnh thẻ giảng viên công khai để### Prompt số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Tải tài nguyên học tập & Tối ưu file dung lượng lớn |
| Phần việc liên quan | Backend / Files Storage / Cloudinary API |
| Mức độ sử dụng | Hỏi sinh code / Tối ưu giải pháp |

#### 5.1. Prompt nguyên văn

```text
[Em - Lần 1]: Em đang xây dựng chức năng Upload tài liệu học tập (Resources) lên Cloudinary cho lớp học. Khi học sinh hoặc giáo viên tải lên các file tài liệu lớn (như tài liệu hướng dẫn zip, slide pptx lớn), hệ thống thỉnh thoảng bị lỗi Timeout mạng hoặc báo lỗi bộ nhớ JVM OutOfMemory do tải toàn bộ file vào RAM trước khi gửi đi. Đồng thời em muốn giới hạn dung lượng tối đa 10MB và chỉ cho phép một số định dạng file tài liệu phổ biến. Hãy viết code tối ưu cho em.
[AI Lần 1]: Đề xuất kiểm tra file.getSize() trước khi xử lý, ném ngoại lệ nếu quá 10MB. Về lưu trữ, khuyên dùng upload stream thông thường của Cloudinary.

// Suy nghĩ của em:
// Gợi ý upload stream thông thường của AI vẫn có thể gây lỗi nghẽn hoặc timeout khi đường truyền mạng của sinh viên không ổn định với các file lớn (tầm 6MB - 10MB). 
// Phương án tốt nhất để xử lý file lớn là sử dụng cơ chế tải lên phân mảnh (Chunked Upload) của Cloudinary bằng phương thức `uploadLarge`. Bằng cách thiết lập kích thước phân mảnh (ví dụ `chunk_size` = 6MB), file sẽ được chia nhỏ và truyền đi liên tục, tốn ít thời gian nhất và tuyệt đối không bao giờ làm tràn bộ nhớ JVM RAM vì luồng dữ liệu được stream trực tiếp từ Client qua Server tới Cloud Storage.
// Đồng thời, tài nguyên lớp học không chỉ có dạng "file tải lên" mà giáo viên/học sinh có thể chia sẻ các đường "link liên kết" (dạng ResourceType.LINK như Google Drive, Figma, slide online). Nếu là link liên kết thì không cần upload gì cả, chỉ lưu URL với kích thước 0. Và khi người dùng bấm nút tải xuống tài nguyên lớp học, hệ thống bắt buộc phải kiểm tra quyền, nếu là tài nguyên dạng LINK thì phải chặn tải xuống và quăng BusinessException ("Không thể tải xuống tài liệu dạng link"), yêu cầu họ mở trực tiếp trên trình duyệt.

[Em - Lần 2 (Tối ưu tải lên phân mảnh, whitelist và xử lý tài nguyên dạng Link)]:
Hãy cải tiến mã nguồn lưu trữ file:
1. Thêm bộ lọc Whitelist định dạng file tài liệu ở Service: kiểm tra phần mở rộng file có thuộc danh sách `.doc, .docx, .xls, .xlsx, .pdf, .txt, .jpg, .jpeg, .png, .ppt, .pptx` không.
2. Tại CloudinaryFileStorageServiceImpl, nếu kích thước file > 6MB, hãy kích hoạt `cloudinary.uploader().uploadLarge` với cấu hình `"chunk_size", 6000000` (6MB) để chia nhỏ gói tin và stream trực tiếp. Dưới 6MB thì dùng `upload` thông thường để tiết kiệm số request mạng.
3. Tạo publicId không chứa phần mở rộng để tránh Cloudinary chặn các tệp nén (.zip).
4. Viết thêm phương thức addLinkResource để hỗ trợ tài nguyên liên kết. Trong phương thức downloadResource, kiểm tra nếu resource.getType() != ResourceType.FILE thì ném BusinessException chặn tải xuống.
[AI Lần 2]: Đồng ý. AI đã sửa lại logic ResourceServiceImpl và CloudinaryFileStorageServiceImpl: Áp dụng phương thức `uploadLarge` khi file > 6MB; sinh mã lọc Whitelist; thêm phương thức addLinkResource; và viết logic kiểm soát tại downloadResource chặn tải xuống đối với tài nguyên dạng Link.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Tối ưu hóa tốc độ tải tệp và tiết kiệm bộ nhớ máy chủ (JVM RAM) khi upload file tài liệu học tập dung lượng lớn lên Cloud Storage.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất phương án sử dụng phương thức uploadLarge của API Cloudinary kết hợp việc truyền InputStream trực tiếp thay vì nạp mảng byte RAM, cùng với regex kiểm tra đuôi mở rộng file.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tích hợp thuật toán upload phân mảnh vào CloudinaryFileStorageServiceImpl.java và bộ lọc mở rộng file tài liệu tại ResourceServiceImpl.java.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự thiết kế thêm logic đóng gói file nén zip động khi tải tài liệu học tập về: Server tự động stream file từ Cloudinary, tạo một thư mục tạm cùng tên với tài liệu bên trong file `.zip` và đóng gói nén zip trả về stream cho client, giúp cấu trúc file tải về luôn gọn gàng và không bị lỗi giải nén.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã nêu rõ dung lượng lớn, nguy cơ tràn bộ nhớ và nhu cầu lọc đuôi file)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI cung cấp đúng hướng đi kết hợp stream phân mảnh)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI tiếp thu phản biện và chuyển đổi sang uploadLarge nhanh chóng)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: AI lúc đầu gợi ý stream upload thông thường vẫn tải toàn bộ dữ liệu vào buffer tạm gây tốn tài nguyên RAM của server khi chịu tải lớn)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | ResourceServiceImpl.java, CloudinaryFileStorageServiceImpl.java |
| Kết quả chạy/test | Upload tệp nén dự án 9.5MB thành công chỉ trong vài giây, bộ nhớ JVM RAM cực kì ổn định. Tải lên tệp độc hại hoặc sai mở rộng (như .exe) bị hệ thống phát hiện và chặn tức thì. |

#### 5.8. Ghi chú thêm

```text
Việc phân chia kích thước tải lên (chunk size) là mẫu thiết kế tối ưu khi lưu trữ tệp trên Cloud Storage.
```

--- Chart, đồng thời thêm điều kiện lọc dự án hoạt động.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Xử lý logic tính toán dữ liệu thống kê tích hợp cho Classroom Dashboard, phục vụ vẽ biểu đồ Line Chart và Heatmap 365 ngày.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất logic truy vấn gom nhóm theo ngày PostgreSQL (`findCommitDatesByProject`), thuật toán điền khuyết thiếu giá trị 0 vào danh sách Line Chart để tránh lỗi hiển thị.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng mã nguồn tính toán chỉ số thống kê vào ClassroomServiceImpl.java và ánh xạ qua Controller trả về API JSON DTO.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Sắp xếp trước danh sách đóng góp của các nhóm giảm dần theo commit ngay từ Backend (`teamContributions.sort`) để giảm thời gian xử lý và giảm tải tính toán cho phía giao diện (React).
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã nêu đủ các loại biểu đồ Line Chart, Heatmap và các chỉ số mong muốn)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI cung cấp phương thức gom nhóm ngày tháng và lấp đầy dữ liệu Line Chart chính xác)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI sinh mã nguồn tính toán đúng cấu trúc chỉ sau 2 lượt thảo luận)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: AI lúc đầu bỏ qua vấn đề Line Chart bị lệch/lỗi hiển thị khi có ngày không có commit nào)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | ClassroomServiceImpl.java, ClassroomController.java |
| Kết quả chạy/test | Dashboard hiển thị đầy đủ số liệu sĩ số, biểu đồ cột đóng góp, Line Chart tần suất tuần và Grid ô màu Heatmap hoạt động 1 năm qua. |

#### 5.8. Ghi chú thêm

```text
Việc chuẩn hóa dữ liệu trống trước khi gửi về frontend là bắt buộc đối với các biểu đồ phức tạp như Recharts hoặc Contribution Calendar.
```

---

### Prompt số 14

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 27/05/2026 |
| Công cụ AI | Gemini |
| Mục đích | Tải tài nguyên học tập & Tối ưu file dung lượng lớn |
| Phần việc liên quan | Backend / Files Storage / Cloudinary API |
| Mức độ sử dụng | Hỏi sinh code / Tối ưu giải pháp |

#### 5.1. Prompt nguyên văn

```text
[Em - Lần 1]: Em đang xây dựng chức năng Upload tài liệu học tập (Resources) lên Cloudinary cho lớp học. Khi học sinh hoặc giáo viên tải lên các file tài liệu lớn (như tài liệu hướng dẫn zip, slide pptx lớn), hệ thống thỉnh thoảng bị lỗi Timeout mạng hoặc báo lỗi bộ nhớ JVM OutOfMemory do tải toàn bộ file vào RAM trước khi gửi đi. Đồng thời em muốn giới hạn dung lượng tối đa 10MB và chỉ cho phép một số định dạng file tài liệu phổ biến. Hãy viết code tối ưu cho em.
[AI Lần 1]: Đề xuất kiểm tra file.getSize() trước khi xử lý, ném ngoại lệ nếu quá 10MB. Về lưu trữ, khuyên dùng upload stream thông thường của Cloudinary.

// Suy nghĩ của em:
// Gợi ý upload stream thông thường của AI vẫn có thể gây lỗi nghẽn hoặc timeout khi đường truyền mạng của sinh viên không ổn định với các file lớn (tầm 6MB - 10MB). 
// Phương án tốt nhất để xử lý file lớn là sử dụng cơ chế tải lên phân mảnh (Chunked Upload) của Cloudinary bằng phương thức `uploadLarge`. Bằng cách thiết lập kích thước phân mảnh (ví dụ `chunk_size` = 6MB), file sẽ được chia nhỏ và truyền đi liên tục, tốn ít thời gian nhất và tuyệt đối không bao giờ làm tràn bộ nhớ JVM RAM vì luồng dữ liệu được stream trực tiếp từ Client qua Server tới Cloud Storage.
// Đồng thời, tài nguyên lớp học không chỉ có dạng "file tải lên" mà giáo viên/học sinh có thể chia sẻ các đường "liChọn một prompt có ảnh hưởng lớn nhất đến bài tập/project.

### 6.1. Prompt được chọn

```text
Hãy phân tích cơ chế trục xuất Session của người dùng bị khóa tài khoản ngay lập tức (Active Session Revocation) trong Spring Security sử dụng Redis Session Registry kết hợp gửi WebSocket notify để Frontend cập nhật ngay lập tức mà không cần F5 trang.
```

### 6.2. Vì sao prompt này quan trọng?

```text
Prompt này giải quyết một lỗ hổng bảo mật nghiêm trọng (Passive Lockout) của AI. Nó mở ra hướng đi kết hợp giữa Stateful Token Invalidation và WebSocket Reactive Push để giải quyết triệt để bài toán đồng bộ hóa trạng thái tài khoản thời gian thực.
```

### 6.3. Kết quả prompt này mang lại

```text
AI cung cấp cấu trúc `SessionRegistryListener` để quản lý danh sách session của từng User, và tích hợp gửi tín hiệu qua `NotificationWebSocketHandler` về Client.
```

### 6.4. Sinh viên/nhóm đã kiểm tra kết quả như thế nào?

```text
Nhóm chạy thử E2E: đăng nhập trên 2 trình duyệt độc lập bằng cùng một tài khoản, thực hiện block tài khoản đó trên màn hình Admin, và kiểm tra xem cả hai trình duyệt có bị buộc đăng xuất và hiển thị LockOverlay tức thì hay không.
```

### 6.5. Sinh viên/nhóm đã cải tiến gì từ kết quả AI?

```text
AI viết thiếu phần đồng bộ lưu trạng thái khóa cục bộ trong React Store khiến F5 bị mất màn hình khóa. Nhóm đã tự bổ sung Axios Interceptor để bắt lỗi 423 Locked và lưu cứng trạng thái `isLockedOut` vào Zustand Store.
```

---

## 7. Prompt chưa hiệu quả

Ghi lại ít nhất một prompt chưa tạo ra kết quả tốt hoặc chưa phù hợp.

### 7.1. Prompt chưa hiệu quả

```text
Viết code API lọc danh sách dự án có kèm theo phân trang và lọc theo trạng thái status.
```

### 7.2. Vì sao prompt này chưa hiệu quả?

```text
Prompt quá ngắn, thiếu bối cảnh cấu trúc Entity và không nêu rõ cột status là kiểu dữ liệu custom enum của PostgreSQL, dẫn đến AI sinh ra câu lệnh CAST sai cú pháp làm crash ứng dụng Spring Boot.
```

Gợi ý nguyên nhân:

- Prompt quá ngắn.
- Thiếu bối cảnh bài toán.
- Không nêu rõ yêu cầu đầu ra.
- Không cung cấp ngôn ngữ lập trình/công nghệ đang dùng.
- Không đưa lỗi cụ thể.
- Không đưa ví dụ input/output.
- Không yêu cầu AI giải thích.
- Hỏi AI làm toàn bộ thay vì hỏi từng phần.

### 7.3. Cách cải thiện prompt

```text
Cung cấp rõ định nghĩa thực thể Entity Project, tên cột, kiểu dữ liệu custom enum, và yêu cầu AI sử dụng các hàm JPA Repository riêng biệt thay vì gộp CAST dưới database.
```

### 7.4. Prompt sau khi cải tiến

```text
Tôi đang sử dụng Spring Data JPA kết hợp PostgreSQL. Cột status trong bảng projects là kiểu custom enum 'project_status_enum'. Khi viết API tìm kiếm phân trang có bộ lọc status (có thể null), câu lệnh HQL/JPQL gộp OR null sẽ báo lỗi không khớp kiểu dữ liệu VARCHAR và Custom Enum. Hãy hướng dẫn tôi viết các hàm JPA Repository chuyên biệt hóa (Query Specialization) tương ứng với từng tổ hợp tham số status và name để rẽ nhánh xử lý ở Service.
```

### 7.5. Kết quả sau khi cải tiến prompt

```text
AI sinh ra 4 phương thức truy vấn Repository độc lập và rõ ràng, giúp mã nguồn biên dịch thành công và loại bỏ hoàn toàn lỗi JDBC enum casting.
```

---

## 8. Bài học về cách viết prompt

### 8.1. Khi viết prompt, em/nhóm cần cung cấp thông tin gì để AI trả lời tốt hơn?

```text
Mục tiêu, bối cảnh nghiệp vụ của dự án (đặc biệt là các ràng buộc như Review Gate), công nghệ đang sử dụng (Spring Boot, Postgres custom enum), cấu trúc bảng, lỗi cụ thể (kèm stacktrace) và ràng buộc đầu ra.
```

Gợi ý:

- Mục tiêu cần đạt.
- Bối cảnh bài toán.
- Công nghệ/ngôn ngữ lập trình đang dùng.
- Input/output mong muốn.
- Ràng buộc của đề bài.
- Lỗi đang gặp.
- Format kết quả mong muốn.
- Yêu cầu AI giải thích từng bước.

### 8.2. Em/nhóm đã học được gì về cách đặt câu hỏi cho AI?

```text
Đặt câu hỏi từng bước (step-by-step), không nên bắt AI viết cả một tính năng lớn ngay từ đầu. Luôn chủ động phản biện thiết kế hời hợt của AI để vá bảo mật.
```

### 8.3. Lần sau em/nhóm sẽ cải thiện prompt như thế nào?

```text
Chuẩn bị tài liệu thiết kế database và đặc tả API rõ ràng trước khi prompt AI viết code logic.
```

---

## 9. Phân loại prompt đã sử dụng

Đánh dấu số lượng prompt theo từng nhóm.

| Loại prompt | Số lượng | Ví dụ prompt tiêu biểu |
|---|---:|---|
| Prompt phân tích yêu cầu | 1 | Thiết lập hệ thống kháng cáo (UserAppeal) có lịch sử |
| Prompt giải thích kiến thức | 1 | Hỏi về sự khác biệt kiến trúc giữa WebSockets và SSE |
| Prompt thiết kế giải pháp | 3 | Cơ chế Lock kép đa IP, Progressive Lockout, Active Session Revocation |
| Prompt thiết kế database | 2 | Cấu trúc bảng user_appeals, bảng dự án |
| Prompt sinh code mẫu | 5 | Tạo Controller, DTO, Mapper, Component React, Cloudinary Chunked |
| Prompt debug lỗi | 3 | Debug lỗi CORS di động, lỗi CAST custom enum Postgres, lỗi Axios redirect loop |
| Prompt viết test case | 0 | (Không sử dụng AI viết test case) |
| Prompt review code | 1 | Nhờ AI rà soát mã hóa JWT token và token gửi email |
| Prompt tối ưu code | 2 | Tối ưu hóa dung lượng Chunked upload, dọn dẹp file Cloudinary |
| Prompt viết báo cáo | 0 | (Không sử dụng AI viết báo cáo) |
| Prompt chuẩn bị thuyết trình | 0 | (Không sử dụng AI làm slide) |
| Prompt khác | 0 | |

---

## 10. Checklist chất lượng prompt

Sinh viên/nhóm tự kiểm tra chất lượng prompt đã dùng.

| Tiêu chí | Đã đạt? | Ghi chú |
|---|:---:|---|
| Prompt có mục tiêu rõ ràng | Đạt | Luôn nêu rõ mục đích xử lý ngay từ câu mở đầu. |
| Prompt có đủ bối cảnh | Đạt | Đưa bối cảnh bảo mật và vai trò của user liên quan. |
| Prompt có nêu công nghệ/ngôn ngữ sử dụng | Đạt | Ghi rõ Spring Boot, Java, PostgreSQL, React, Zustand. |
| Prompt có nêu yêu cầu đầu ra | Đạt | Ép AI xuất cấu trúc DTO, API Path cụ thể. |
| Prompt không yêu cầu AI làm toàn bộ bài một cách máy móc | Đạt | Chỉ hỏi từng phần giải thuật và cấu hình boilerplate. |
| Prompt có yêu cầu AI giải thích hoặc phân tích | Đạt | Yêu cầu so sánh (như SSE vs WebSocket) trước khi code. |
| Kết quả AI được kiểm tra lại | Đạt | Kiểm thử E2E và viết Concurrency test case. |
| Kết quả AI được chỉnh sửa trước khi sử dụng | Đạt | Phản biện vá lỗi bảo mật, sửa lỗi CAST enum. |
| Prompt quan trọng được ghi lại đầy đủ | Đạt | Ghi lại đầy đủ 16 prompt quan trọng nhất. |
| Prompt sai/chưa hiệu quả được rút kinh nghiệm | Đạt | Ghi nhận rõ lỗi CAST JPQL ở Prompt chưa hiệu quả. |

---

## 11. Cam kết sử dụng prompt minh bạch

Sinh viên/nhóm cam kết rằng:

- Các prompt quan trọng đã được ghi nhận trung thực.
- Không che giấu việc sử dụng AI trong các phần quan trọng của bài.
- Không nộp nguyên văn kết quả AI nếu chưa kiểm tra và chỉnh sửa.
- Có khả năng giải thích các phần đã sử dụng từ AI.
- Chịu trách nhiệm với sản phẩm cuối cùng.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Nguyễn Thành Đạt | 30/06/2026 |hướng đi kết hợp stream phân mảnh)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: AI tiếp thu phản biện và chuyển đổi sang uploadLarge nhanh chóng)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: AI lúc đầu gợi ý stream upload thông thường vẫn tải toàn bộ dữ liệu vào buffer tạm gây tốn tài nguyên RAM của server khi chịu tải lớn)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | ResourceServiceImpl.java, CloudinaryFileStorageServiceImpl.java |
| Kết quả chạy/test | Upload tệp nén dự án 9.5MB thành công chỉ trong vài giây, bộ nhớ JVM RAM cực kì ổn định. Tải lên tệp độc hại hoặc sai mở rộng (như .exe) bị hệ thống phát hiện và chặn tức thì. |

#### 5.8. Ghi chú thêm

```text
Việc phân chia kích thước tải lên (chunk size) là mẫu thiết kế tối ưu khi lưu trữ tệp trên Cloud Storage.
```

```

---

### Prompt số 15

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 28/06/2026 |
| Công cụ AI | Gemini |
| Mục đích | Thiết kế Trang quản trị tài khoản Admin, Kháng cáo & Thu hồi Session tức thời |
| Phần việc liên quan | Security / Session Management / WebSockets |
| Mức độ sử dụng | Hỏi ý tưởng / Thiết kế kiến trúc / Sinh mã nguồn |

#### 5.1. Prompt nguyên văn

```text
[Em - Lần 1]: Em đang muốn xây dựng tính năng Admin quản lý người dùng (Block/Unblock tài khoản). Khi tài khoản bị block, hệ thống cần hỗ trợ họ gửi đơn kháng cáo kèm theo lý do giải trình và tài liệu minh chứng (upload ảnh/PDF lên Cloudinary). Anh thiết kế cho em API và Database của phần này.
[AI Lần 1]: 
AI đề xuất thêm trực tiếp các trường thông tin kháng cáo vào bảng `user_accounts` (như `appeal_reason`, `appeal_evidence_url`, `appeal_status`, `appeal_comment`). Đồng thời, thiết lập API upload tài liệu minh chứng nằm ở Controller Admin hoặc yêu cầu authenticated để bảo mật.

[Em - Lần 2 (Phản biện thiết kế Database, API Upload và Thu hồi Session)]:
1. Lưu trực tiếp các cột appeal trên bảng `user_accounts` sẽ làm mất lịch sử kháng cáo nếu user bị khóa và mở khóa nhiều lần. Hãy tách thành bảng riêng `user_appeals` liên kết Many-to-One với `user_accounts` để lưu trữ lịch sử kháng cáo của mỗi tài khoản. Viết migration SQL tách biệt.
2. API upload file minh chứng kháng cáo `/api/v1/auth/upload` phải đi qua không cần token (permitAll), giới hạn đuôi file tài liệu đính kèm (pdf, zip, png, jpg) và dung lượng tối đa 10MB vì user đang bị khóa tài khoản không có session đăng nhập hợp lệ để gọi API upload.
3. Khi Admin block user, làm sao để hủy toàn bộ Session đang hoạt động của user đó trên Redis ngay lập tức (Real-time Session Revocation) thay vì đợi request tiếp theo kiểm tra DB? Gửi thông báo WebSocket để dựng giao diện LockOverlay tức thì bên React.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Module quản trị tài khoản cần một cơ chế bảo mật chủ động: trục xuất ngay lập tức các phiên làm việc của tài khoản bị khóa trên Redis để ngăn chặn hacker tiếp tục phá hoại, đồng thời thiết kế luồng kháng cáo bảo mật cho người dùng bị khóa oan.
```

#### 5.3. Kết quả AI trả về

```text
AI cung cấp cấu trúc bảng `user_appeals`, logic gọi `SessionRegistryListener.invalidateSessionsForUser(id)` để quét sạch session trên Redis, code Controller Auth upload file đi qua permitAll, và logic gửi tin nhắn lock qua WebSocket.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Áp dụng cấu trúc bảng user_appeals, logic dọn dẹp session của user bị block trên Redis, và giao diện hiển thị LockOverlay React khi nhận sự kiện khóa.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự viết logic xử lý ở backend: Khi người dùng kháng cáo thành công (Admin approve appeal), hệ thống tự động kích hoạt lại tài khoản đồng thời cập nhật trạng thái đơn kháng cáo thành `APPROVED`, gửi Email thông báo chi tiết kèm lời nhắn giải trình từ Admin. Nếu Admin từ chối, đơn chuyển trạng thái `REJECTED` và gửi tài liệu mail thông báo lý do chi tiết.
Đồng thời, tự phát triển cơ chế mở khóa phản hồi thời gian thực ở Frontend: Thiết lập bộ nghe sự kiện WebSocket `USER_UNLOCKED` tại `useNotificationStore.js` để tự động chuyển `isLockedOut` thành `false` trong Zustand Store, kích hoạt React gỡ bỏ (unmount) `LockOverlay.jsx` trong `App.jsx` ngay lập tức mà không cần F5.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Cung cấp đầy đủ các kịch bản khóa, yêu cầu email thông báo và thiết kế bảng dữ liệu)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI đề xuất đúng giải pháp thu hồi session và tách bảng lịch sử kháng cáo sau phản biện)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: Chỉ cần qua 1 lượt phản biện để giải quyết trọn vẹn lỗ hổng bảo mật session và database)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều (phản biện lại AI)
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Gợi ý ban đầu của lưu cột appeal trực tiếp trong bảng user_accounts gây mất lịch sử, và bắt xác thực ở endpoint upload làm nghẽn luồng kháng cáo)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | SystemAdminService.java, LockOverlay.jsx, UserManagementPage.jsx |
| Kết quả chạy/test | Block tài khoản làm bay màu session của user trên Redis ngay lập tức. Màn hình user tự động chuyển sang LockOverlay báo đỏ. Duyệt kháng cáo gửi email thông báo tự động hoạt động tốt. |

#### 5.8. Ghi chú thêm

```text
Sự kết hợp giữa WebSocket và quản lý session Redis giúp kiểm soát bảo mật hệ thống ở mức thời gian thực (Real-time Security control).
```

---

### Prompt số 16

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng | 29/06/2026 |
| Công cụ AI | Gemini |
| Mục đích | Thiết kế Dashboard quản lý Mentor & Thu hồi (Revoke) |
| Phần việc liên quan | Backend / Frontend / Real-time Notification / Cloudinary Cleanup |
| Mức độ sử dụng | Hỏi ý tưởng / Thiết kế kiến trúc / Sinh mã nguồn |

#### 5.1. Prompt nguyên văn

```text
[Em - Lần 1]: Em đang làm giao diện Admin quản lý danh sách yêu cầu xác thực Mentor (để duyệt hoặc từ chối). Em muốn bổ sung một tính năng "Thu hồi" (Revoke). Khi Admin click thu hồi yêu cầu đã duyệt trước đó, hệ thống sẽ đổi trạng thái request thành CANCELLED. Anh viết code API cho em.
[AI Lần 1]: Đề xuất viết endpoint `@PostMapping("/{id}/revoke")` và chỉ cập nhật trường trạng thái của request thành CANCELLED trong database.

[Em - Lần 2 (Phản biện thiết kế Revoke, tách biệt API SSE và thống kê số lớp)]:
1. Việc thu hồi quyền Mentor không chỉ đơn giản là đổi trạng thái đơn. Nếu chỉ đổi trạng thái đơn mà không hạ cấp quyền (System Role) của họ từ MENTOR về lại USER trong bảng `user_accounts`, họ vẫn tiếp tục có quyền tạo lớp học và xem tài nguyên giảng viên, gây rò rỉ quyền hạn nghiêm trọng.
2. Tệp ảnh thẻ giảng viên nhạy cảm (Private file) trên Cloudinary của đơn đó cần được xóa bỏ hoàn toàn ngay khi bị thu hồi để tránh rác ổ đĩa và rò rỉ dữ liệu cá nhân của giảng viên bị tước quyền.
3. Cần gửi thông điệp WebSocket realtime báo cho client của Mentor biết họ đã bị thu hồi quyền để Frontend tự động hạ cấp giao diện và ép dọn dẹp các quyền hạn trên RAM.
4. API stream SSE và API lấy danh sách requests đang bị trùng lặp đường dẫn nếu cấu hình chung, dẫn đến lỗi Duplicate API mapping trên Spring Boot và gây nghẽn luồng.

Hãy thiết kế lại cho em:
- Cập nhật `verifyStatus = UNVERIFIED`, hạ cấp role hệ thống của user về `USER`. Đồng thời gọi fileStorageService xóa file ảnh thẻ trên Cloudinary, gửi WebSocket thông báo `VERIFICATION_UPDATE` trực tiếp đến userId bị thu hồi.
- Tách biệt API SSE stream sang endpoint riêng `/api/v1/mentor-verifications/stream`.
- Khi Admin lấy danh sách request, hãy thực hiện truy vấn đếm số lượng lớp học (`classroomCount`) mà user đó đang sở hữu thông qua `academicContextRepository.countByOwnerId`.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Cần xây dựng hệ thống quản lý quyền hạn vòng đời của Mentor một cách toàn diện và an toàn: có khả năng thu hồi quyền hạn ngay lập tức, tự động dọn dẹp file nhạy cảm và rẽ nhánh luồng dữ liệu API sạch.
```

#### 5.3. Kết quả AI trả về

```text
AI đề xuất mã nguồn phương thức `revokeRequest` thực hiện hạ vai trò, xóa file, bắn WebSocket; cung cấp endpoint `/stream` và query đếm số lớp học.
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Tích hợp logic thu hồi quyền và dọn dẹp file private vào MentorVerificationServiceImpl.java; tách API stream ở MentorVerificationController.java.
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Tự thiết kế Frontend: Nhóm các request theo từng User trên bảng điều khiển để tránh spam giao diện, hiển thị nút Revoke động (chỉ cho phép khi request đã APPROVED) và thiết kế Popup bắt buộc nhập lý do thu hồi để lưu lịch sử phục vụ đối soát sau này.
```

#### 5.6. Đánh giá chất lượng prompt

- [x] Prompt rõ ràng
- [x] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin (Lý do: Đã chỉ rõ đầy đủ 4 bước thu hồi bảo mật, tách biệt API và thống kê lớp học)
- [x] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp (Lý do: AI đề xuất đúng code thực thi rẽ nhánh vai trò và xóa tệp sau phản biện)
- [ ] Cần hỏi lại AI nhiều lần (Lý do: Chỉ cần qua 1 lượt phản biện để giải quyết trọn vẹn lỗ hổng bảo mật)
- [x] Cần tự kiểm tra và chỉnh sửa nhiều (phản biện lại AI)
- [x] Kết quả AI có lỗi hoặc chưa chính xác (Lý do: Đề xuất ban đầu của AI bỏ qua bước hạ cấp vai trò hệ thống và giữ lại file ảnh nhạy cảm trên Cloudinary gây rò rỉ dữ liệu)

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | MentorVerificationServiceImpl.java, MentorVerificationController.java |
| Kết quả chạy/test | Click thu hồi lập tức hạ role Mentor xuống USER, ảnh thẻ bị xóa khỏi Cloudinary, và UI của Mentor nhận WebSocket báo hạ quyền ngay lập tức. |

#### 5.8. Ghi chú thêm

```text
Việc kết hợp dọn dẹp file vật lý trong quy trình thu hồi quyền là yếu tố quan trọng để đảm bảo tính gọn nhẹ và an toàn dữ liệu của hệ thống.
```

---

## 7. Prompt quan trọng nhất

Chọn một prompt có ảnh hưởng lớn nhất đến bài tập/project.

### 6.1. Prompt được chọn

```text
Dán prompt quan trọng nhất tại đây.
```

### 6.2. Vì sao prompt này quan trọng?

```text
Viết tại đây...
```

### 6.3. Kết quả prompt này mang lại

```text
Viết tại đây...
```

### 6.4. Sinh viên/nhóm đã kiểm tra kết quả như thế nào?

```text
Viết tại đây...
```

### 6.5. Sinh viên/nhóm đã cải tiến gì từ kết quả AI?

```text
Viết tại đây...
```

---

## 7. Prompt chưa hiệu quả

Ghi lại ít nhất một prompt chưa tạo ra kết quả tốt hoặc chưa phù hợp.

### 7.1. Prompt chưa hiệu quả

```text
Dán prompt chưa hiệu quả tại đây.
```

### 7.2. Vì sao prompt này chưa hiệu quả?

```text
Viết tại đây...
```

Gợi ý nguyên nhân:

- Prompt quá ngắn.
- Thiếu bối cảnh bài toán.
- Không nêu rõ yêu cầu đầu ra.
- Không cung cấp ngôn ngữ lập trình/công nghệ đang dùng.
- Không đưa lỗi cụ thể.
- Không đưa ví dụ input/output.
- Không yêu cầu AI giải thích.
- Hỏi AI làm toàn bộ thay vì hỏi từng phần.

### 7.3. Cách cải thiện prompt

```text
Viết tại đây...
```

### 7.4. Prompt sau khi cải tiến

```text
Dán prompt đã được cải tiến tại đây.
```

### 7.5. Kết quả sau khi cải tiến prompt

```text
Viết tại đây...
```

---

## 8. Bài học về cách viết prompt

### 8.1. Khi viết prompt, em/nhóm cần cung cấp thông tin gì để AI trả lời tốt hơn?

```text
Viết tại đây...
```

Gợi ý:

- Mục tiêu cần đạt.
- Bối cảnh bài toán.
- Công nghệ/ngôn ngữ lập trình đang dùng.
- Input/output mong muốn.
- Ràng buộc của đề bài.
- Lỗi đang gặp.
- Format kết quả mong muốn.
- Yêu cầu AI giải thích từng bước.

### 8.2. Em/nhóm đã học được gì về cách đặt câu hỏi cho AI?

```text
Viết tại đây...
```

### 8.3. Lần sau em/nhóm sẽ cải thiện prompt như thế nào?

```text
Viết tại đây...
```

---

## 9. Phân loại prompt đã sử dụng

Đánh dấu số lượng prompt theo từng nhóm.

| Loại prompt | Số lượng | Ví dụ prompt tiêu biểu |
|---|---:|---|
| Prompt phân tích yêu cầu |  |  |
| Prompt giải thích kiến thức |  |  |
| Prompt thiết kế giải pháp |  |  |
| Prompt thiết kế database |  |  |
| Prompt sinh code mẫu |  |  |
| Prompt debug lỗi |  |  |
| Prompt viết test case |  |  |
| Prompt review code |  |  |
| Prompt tối ưu code |  |  |
| Prompt viết báo cáo |  |  |
| Prompt chuẩn bị thuyết trình |  |  |
| Prompt khác |  |  |

---

## 10. Checklist chất lượng prompt

Sinh viên/nhóm tự kiểm tra chất lượng prompt đã dùng.

| Tiêu chí | Đã đạt? | Ghi chú |
|---|:---:|---|
| Prompt có mục tiêu rõ ràng |  |  |
| Prompt có đủ bối cảnh |  |  |
| Prompt có nêu công nghệ/ngôn ngữ sử dụng |  |  |
| Prompt có nêu yêu cầu đầu ra |  |  |
| Prompt không yêu cầu AI làm toàn bộ bài một cách máy móc |  |  |
| Prompt có yêu cầu AI giải thích hoặc phân tích |  |  |
| Kết quả AI được kiểm tra lại |  |  |
| Kết quả AI được chỉnh sửa trước khi sử dụng |  |  |
| Prompt quan trọng được ghi lại đầy đủ |  |  |
| Prompt sai/chưa hiệu quả được rút kinh nghiệm |  |  |

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
|  |  |
