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
| Repository URL | N/A |
| Ngày bắt đầu | 18/05/2026 |
| Ngày hoàn thành | 27/06/2026 |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính |
|---|---|---|
| Phase 01 | 18/05 - 28/05 | Khởi tạo, Giao diện UI & Kiến trúc Database |
| Phase 02 | 29/05 - 06/06 | Backend Core, E2E Testing & Sửa lỗi hệ thống |
| Phase 03 | 07/06 - 15/06 | R&D Module Biểu đồ UML Động & Giao diện tương tác |
| Phase 04 | 16/06 - 27/06 | Bảo mật, Tối ưu Real-time, Refactoring & CI/CD |

---

# [Phase 01] Khởi tạo, Giao diện UI & Kiến trúc Database (18/05 - 28/05)

## [2026-05-18]
Author: Trần Công Tú

### Added
- Khởi tạo thư mục gốc của project.
- Thêm file .gitignore và khởi tạo repo Git.
- Cập nhật danh sách các Idea sơ bộ.

### AI-assisted
- Dùng Gemini để brainstorm ý tưởng cốt lõi (Task Management, Peer-review, UML Drawing). Kết quả được chọn lọc và lưu vào idea.md.

## [2026-05-19]
Author: Trần Công Tú

### Added
- Tạo bộ khung file tài liệu Requirement.

### AI-assisted
- Dùng Claude để tự động sinh cấu trúc Use Case dựa trên các tính năng đã chốt. Tự gỡ bỏ tính năng duyệt task rườm rà.

## [2026-05-20]
Author: Trần Công Tú

### Changed
- Phân rã Work Breakdown Structure (WBS) thành các task Frontend và Backend.

### AI-assisted
- Nhờ Claude chia nhỏ module UML để dễ code hơn. Phê duyệt bảng WBS cùng team.

## [2026-05-22]
Author: Trần Công Tú

### Added
- Code khung HTML/CSS tĩnh cho giao diện Dashboard.

### Changed
- Tự tay gắn thư viện Chart.js thay vì dùng giao diện AI gợi ý.

### AI-assisted
- Dùng Stitch gen code CSS Grid cho layout 2 cột.

## [2026-05-24]
Author: Trần Công Tú

### Fixed
- Dọn dẹp dữ liệu Mock (Fake array data) mà AI tạo trên giao diện. Bắt buộc gọi qua API.

### AI-assisted
- Nhờ Kiro kiểm tra vì sao UI không update data, phát hiện do AI hardcode, ép đổi thành fetch API để chuẩn bị cho giai đoạn code Backend.

## [2026-05-26]
Author: Trần Công Tú

### Added
- Tích hợp hệ thống quản lý Database Migration (Knex) để quản lý cấu trúc PostgreSQL chuyên nghiệp, từ chối sửa DB bằng tay.

### AI-assisted
- Dùng Claude thiết kế kiến trúc DB và yêu cầu Antigravity viết lệnh init Knex Migration.

## [2026-05-28]
Author: Trần Công Tú

### Changed
- Từ bỏ giải pháp hình ảnh tĩnh Mermaid.js (quá cứng nhắc). Đổi nền tảng biểu đồ ngay từ khâu thiết kế.

### AI-assisted
- Gemini tư vấn đổi qua React Flow để có tính năng Drag Drop. Tinh thần không ngại đập bỏ để tối ưu sớm.

---

# [Phase 02] Backend Core & E2E Testing (29/05 - 06/06)

## [2026-05-29]
Author: Trần Công Tú

### Added
- Chức năng Authentication và Phân quyền Role.
- Middleware kiểm tra User token.

### AI-assisted
- Dùng Antigravity code Auth middleware. Tự bổ sung cơ chế bắt lỗi TokenExpiredError để tăng tính bảo mật.

## [2026-05-30]
Author: Trần Công Tú

### Fixed
- Sửa lỗi Login không gửi kèm Cookie chứa token lên server do thiếu SameSite và CORS.
- Update server.js cấu hình allowed origin.

### AI-assisted
- Nhờ Kiro quét lỗi CORS và xác định nguyên nhân.
- Dùng Antigravity code lại đoạn CORS config dựa trên chỉ định của Kiro. Tôi đã chuyển Domain thành file .env cho an toàn.

## [2026-06-02]
Author: Trần Công Tú

### Added
- Chức năng Create Task với field nhập estimate_hours. Tích hợp PostgreSQL.

### Changed
- Bổ sung schema Zod để thay thế luồng validate if-else lộn xộn cũ.

### AI-assisted
- Dùng Antigravity code Controller lưu xuống PostgreSQL, nhưng đã chủ động yêu cầu Claude sinh Zod validation thay vì tự tay viết.

## [2026-06-04]
Author: Trần Công Tú

### Fixed
- Sửa lỗi API báo 200 nhưng PostgreSQL không có data mới. (End-to-End Testing bug)

### AI-assisted
- Bắt quả tang Antigravity giả mạo query thông qua log báo của Kiro. Ép Antigravity dùng đúng chuẩn kết nối thực thi DB thật sự.

---

# [Phase 03] Module UML & Tương tác giao diện (07/06 - 15/06)

## [2026-06-08]
Author: Trần Công Tú

### Added
- Thiết kế hệ thống (Architecture) phần luồng xử lý Node và Edge cho module vẽ UML React Flow.

### AI-assisted
- Dùng Claude và Gemini nghiên cứu sâu React Flow, lên meta-prompt chi tiết trước khi bước vào code. Đây là bước sống còn để kiểm soát logic AI code sau này.

## [2026-06-11]
Author: Trần Công Tú

### Added
- Component UmlDiagram.jsx hiển thị bảng vẽ.

### AI-assisted
- Dùng Antigravity gen component dựa trên Master Prompt.

## [2026-06-12]
Author: Trần Công Tú

### Fixed
- Sửa lỗi không nối dây (Edge) được giữa 2 khối UML.
- Thay đổi ID của các thẻ Handle cho đồng nhất trên mọi component.

### AI-assisted
- Dùng Kiro trace bug lỗi đứt kết nối dây. Cập nhật lại yêu cầu để Antigravity code lại.

## [2026-06-14]
Author: Trần Công Tú

### Fixed
- Lỗi giật lag giao diện (giảm FPS) khi thêm xóa node nhiều lần.
- Cấu trúc lại cơ chế lưu State Undo/Redo bằng kỹ thuật Debouncing.

### AI-assisted
- Yêu cầu Antigravity viết custom hook fix lỗi giật lag. AI viết quá rối, nhờ Claude viết lại bản sạch, sau đó ép Antigravity tích hợp vào dự án.

---

# [Phase 04] Bảo mật, Tối ưu hóa hệ thống & DevOps (16/06 - 27/06)

## [2026-06-18]
Author: Trần Công Tú

### Added
- Tích hợp React Error Boundary chặn lỗi Crash UI do đụng độ dữ liệu Optimistic Locking.

### AI-assisted
- Được Kiro chẩn đoán nguyên nhân và nhờ Claude thiết kế cơ chế cảnh báo UI mượt mà (Graceful Degradation).

## [2026-06-20]
Author: Trần Công Tú

### Changed
- (Refactor) Đập bỏ component UmlDiagram.jsx khổng lồ 1500 dòng thành các Custom Hook và component nhỏ tuân thủ Separation of Concerns.

### AI-assisted
- Nhờ Claude vẽ cấu trúc băm nhỏ, sau đó ép Antigravity chia tách các file tương ứng nhằm trả "nợ kỹ thuật" (Technical Debt).

## [2026-06-22]
Author: Trần Công Tú

### Changed
- Cải thiện kiến trúc WebSocket truyền data để đỡ ngốn băng thông và CPU.

### AI-assisted
- Claude cung cấp thuật toán Delta Update cực đỉnh để nén data vẽ gửi cho nhiều user, bắt Antigravity sửa.

## [2026-06-25]
Author: Trần Công Tú

### Added
- Tài liệu Hướng dẫn sử dụng (User Manual).

### Changed
- Điều chỉnh tông giọng tài liệu cho chuẩn văn phong Việt Nam. Gắn screenshot thực tế của app.

### AI-assisted
- Dùng Claude draft bản thô cho User Manual từ file Requirement cũ.

## [2026-06-27]
Author: Trần Công Tú

### Added
- Tích hợp CI/CD Pipeline với GitHub Actions.
- Tự động hóa Testing và Deploy lên server thật (Render).

### AI-assisted
- Gemini sinh file deploy.yml. Tự động hóa vòng đời phần mềm (SDLC) lên mức cao nhất.
