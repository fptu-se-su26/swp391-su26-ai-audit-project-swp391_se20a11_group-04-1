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
| Môn học |  |
| Mã môn học |  |
| Lớp |  |
| Học kỳ |  |
| Tên bài tập / Project |  |
| Tên sinh viên / Nhóm |  |
| MSSV / Danh sách MSSV |  |
| Giảng viên hướng dẫn |  |
| Repository URL |  |
| Ngày bắt đầu |  |
| Ngày hoàn thành |  |

---

## 3. Tổng quan các phiên bản/giai đoạn

| Phiên bản/Giai đoạn | Thời gian | Nội dung chính | Trạng thái |
|---|---|---|---|
| Phase 01 |  | Khởi tạo project | Completed |
| Phase 02 |  | Phân tích yêu cầu | Completed |
| Phase 03 |  | Thiết kế hệ thống | In Progress |
| Phase 04 |  | Implementation | In Progress |
| Phase 05 |  | Testing & Debug | Not Started |
| Phase 06 |  | Hoàn thiện báo cáo và demo | Not Started |

---

# [Phase 01] Khởi tạo project

## Ngày thực hiện

```text
DD/MM/YYYY
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
| 1 | Tạo cấu trúc project ban đầu | Team | Backend / Frontend | Git commit |
| 2 | Setup PostgreSQL và Flyway | Team | Backend | Local run |
| 3 | Tạo các file tài liệu AI audit | Team | docs/ | Repository |

## AI có hỗ trợ không?

- [ ] Có
- [x] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Viết tại đây...
```

## Commit/Screenshot minh chứng

```text
Dán link commit, screenshot hoặc mô tả minh chứng tại đây...
```

## Ghi chú

```text
Viết tại đây...
```

---

# [Phase 02] Phân tích yêu cầu

## Ngày thực hiện

```text
DD/MM/YYYY
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
| 1 | Brainstorm ý tưởng project | Team | Requirement | Discussion |
| 2 | Xác định target user là sinh viên IT | Team | Analysis | Requirement docs |
| 3 | Thiết kế workflow requirement-centric | Team | Use case / Flow | Flow diagram |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ brainstorm ý tưởng project, viết use case, các business rules
```

## Commit/Screenshot minh chứng

```text
Dán link commit, screenshot hoặc mô tả minh chứng tại đây...
```

## Ghi chú

```text
Viết tại đây...
```

---

# [Phase 03] Thiết kế hệ thống

## Ngày thực hiện

```text
DD/MM/YYYY
```

## Đã hoàn thành

- [x] Thiết kế kiến trúc tổng quan
- [x] Thiết kế database/ERD
- [ ] Thiết kế API
- [x] Thiết kế giao diện/wireframe
- [x] Thiết kế flow xử lý
- [ ] Thiết kế class diagram
- [ ] Thiết kế sequence diagram
- [x] Thiết kế security/authorization flow
- [x] Review thiết kế
- [x] Chỉnh sửa thiết kế sau feedback

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 | Thiết kế ERD | Hiếu | Database | Mermaid ERD |
| 2 | Tạo UI prototype bằng Stitch | Team | UI/UX | Stitch screens |

## AI có hỗ trợ không?

- [x] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
AI hỗ trợ tạo prototype UI/UX
```

## Commit/Screenshot minh chứng

```text
Dán link commit, screenshot hoặc mô tả minh chứng tại đây...
```

## Ghi chú

```text
Viết tại đây...
```

---

# [Phase 04] Implementation

## Ngày thực hiện

```text
DD/MM/YYYY
```

## Đã hoàn thành

- [ ] Tạo project structure
- [ ] Cài đặt database connection
- [ ] Xây dựng backend
- [ ] Xây dựng frontend
- [ ] Xây dựng authentication/authorization
- [ ] Xử lý CRUD
- [ ] Xử lý validation
- [ ] Tích hợp API
- [ ] Xử lý upload/download file
- [ ] Xử lý lỗi
- [ ] Tối ưu giao diện
- [ ] Cập nhật README hướng dẫn chạy

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |
| 4 |  |  |  |  |
| 5 |  |  |  |  |

## AI có hỗ trợ không?

- [ ] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Viết tại đây...
```

## Commit/Screenshot minh chứng

```text
Dán link commit, screenshot hoặc mô tả minh chứng tại đây...
```

## Ghi chú

```text
Viết tại đây...
```

---

# [Phase 05] Testing & Debug

## Ngày thực hiện

```text
DD/MM/YYYY
```

## Đã hoàn thành

- [ ] Viết test case
- [ ] Chạy test chức năng chính
- [ ] Kiểm tra output
- [ ] Kiểm tra validation
- [ ] Kiểm tra lỗi giao diện
- [ ] Kiểm tra lỗi database
- [ ] Kiểm tra phân quyền
- [ ] Kiểm tra bảo mật cơ bản
- [ ] Fix bug
- [ ] Chạy lại sau khi fix bug
- [ ] Ghi nhận kết quả test

## Danh sách lỗi đã xử lý

| STT | Lỗi phát hiện | Nguyên nhân | Cách xử lý | Trạng thái |
|---:|---|---|---|---|
| 1 |  |  |  | Open / Fixed / Pending |
| 2 |  |  |  | Open / Fixed / Pending |
| 3 |  |  |  | Open / Fixed / Pending |
| 4 |  |  |  | Open / Fixed / Pending |
| 5 |  |  |  | Open / Fixed / Pending |

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

## AI có hỗ trợ không?

- [ ] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Viết tại đây...
```

## Commit/Screenshot minh chứng

```text
Dán link commit, screenshot hoặc mô tả minh chứng tại đây...
```

## Ghi chú

```text
Viết tại đây...
```

---

# [Phase 06] Hoàn thiện báo cáo và demo

## Ngày thực hiện

```text
DD/MM/YYYY
```

## Đã hoàn thành

- [ ] Hoàn thiện source code
- [ ] Hoàn thiện README.md
- [ ] Hoàn thiện report
- [ ] Hoàn thiện slide
- [ ] Hoàn thiện video demo
- [ ] Kiểm tra lại `AI_AUDIT_LOG.md`
- [ ] Kiểm tra lại `PROMPTS.md`
- [ ] Hoàn thiện `REFLECTION.md`
- [ ] Kiểm tra lại `CHANGELOG.md`
- [ ] Đóng gói bài nộp

## Thay đổi chi tiết

| STT | Nội dung thay đổi | Người thực hiện | File/Module liên quan | Minh chứng |
|---:|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

## AI có hỗ trợ không?

- [ ] Có
- [ ] Không

Nếu có, mô tả AI đã hỗ trợ phần nào:

```text
Viết tại đây...
```

## Commit/Screenshot minh chứng

```text
Dán link commit, screenshot hoặc mô tả minh chứng tại đây...
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
| 1 |  | Completed / Partial / Not Completed |  |  |
| 2 |  | Completed / Partial / Not Completed |  |  |
| 3 |  | Completed / Partial / Not Completed |  |  |
| 4 |  | Completed / Partial / Not Completed |  |  |
| 5 |  | Completed / Partial / Not Completed |  |  |

---

## 4.2. Các chức năng chưa hoàn thành

| STT | Chức năng | Lý do chưa hoàn thành | Hướng cải thiện |
|---:|---|---|---|
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

---

## 4.3. Tổng hợp AI hỗ trợ trong project

| Hạng mục | AI có hỗ trợ không? | Mức độ hỗ trợ | Ghi chú |
|---|---|---|---|
| Requirement | Có / Không | Ít / Trung bình / Nhiều |  |
| Design | Có / Không | Ít / Trung bình / Nhiều |  |
| Database | Có / Không | Ít / Trung bình / Nhiều |  |
| Coding | Có / Không | Ít / Trung bình / Nhiều |  |
| Debug | Có / Không | Ít / Trung bình / Nhiều |  |
| Testing | Có / Không | Ít / Trung bình / Nhiều |  |
| Report | Có / Không | Ít / Trung bình / Nhiều |  |
| Presentation | Có / Không | Ít / Trung bình / Nhiều |  |

---

## 4.4. Bài học rút ra

```text
Viết tại đây...
```

---

## 4.5. Hướng cải thiện tiếp theo

```text
Viết tại đây...
```

---

# 5. Cam kết cập nhật Changelog

Sinh viên/nhóm cam kết rằng nội dung changelog phản ánh đúng các thay đổi đã thực hiện trong quá trình làm bài tập/project.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
|  |  |
