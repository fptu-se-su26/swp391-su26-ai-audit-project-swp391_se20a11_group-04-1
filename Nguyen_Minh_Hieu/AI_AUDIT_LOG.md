# AI Audit Log

## 1. Thông tin chung

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
| Ngày bắt đầu |  |
| Ngày hoàn thành |  |

---

## 2. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng trong quá trình thực hiện bài tập/project.

- [x] ChatGPT
- [x] Gemini
- [x] Claude
- [x] Stitch
- [ ] Cursor
- [ ] Antigravity
- [ ] Perplexity
- [ ] Microsoft Copilot
- [ ] Công cụ khác: ....................................

---

## 3. Mục tiêu sử dụng AI

Mô tả ngắn gọn sinh viên/nhóm đã sử dụng AI để hỗ trợ những công việc nào.

Ví dụ:

- Phân tích yêu cầu bài toán
- Gợi ý ý tưởng giải pháp
- Thiết kế database
- Thiết kế giao diện
- Viết code mẫu
- Debug lỗi
- Tối ưu code
- Viết test case
- Kiểm tra bảo mật
- Viết báo cáo
- Chuẩn bị slide thuyết trình
- Tìm hiểu công nghệ mới

### Mô tả mục tiêu sử dụng AI

Nhóm sử dụng AI chủ yếu để hỗ trợ quá trình phân tích yêu cầu bài toán và thiết kế hệ thống ban đầu cho project DevTrack AI. AI được dùng để brainstorm ý tưởng, phân tích pain point của sinh viên IT khi làm project nhóm, thiết kế requirement, use case, ERD, workflow SDLC, RTM, GitHub integration và UI/UX demo.

Ngoài ra AI còn hỗ trợ review kiến trúc hệ thống, phân tích rủi ro kỹ thuật, các trường hợp khó khăn mà sinh viên có thể gặp phải khi dùng hệ thống, gợi ý database design, xây dựng migration SQL và hỗ trợ viết tài liệu báo cáo.

## 4. Nhật ký sử dụng AI chi tiết

> Mỗi lần sử dụng AI cho một phần quan trọng của bài tập/project, sinh viên cần ghi lại theo mẫu bên dưới.  
> Sinh viên/nhóm có thể nhân bản mẫu “Lần sử dụng AI” nhiều lần tùy theo số lần sử dụng AI thực tế.

---

### Lần sử dụng AI số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng | Brainstorm ý tưởng project |
| Phần việc liên quan | Requirement / Design |
| Mức độ sử dụng | Hỗ trợ ý tưởng |

#### 4.1. Prompt đã sử dụng

```
Brainstorm cho tôi một ý tưởng project 9 tuần cho nhóm 5 người, có AI integration, scope vừa đủ lớn nhưng không quá nặng. Tập trung vào painpoint thật của sinh viên, đặc biệt là nhóm ngành sinh viên IT, phân tích các trường hợp mà nhóm có thể giải quyết được. Đưa ra nhiều lựa chọn khác nhau, phân tích điểm mạnh và điểm yếu của từng lựa chọn 
```

#### 4.2. Kết quả AI gợi ý

Tóm tắt nội dung AI đã trả lời hoặc gợi ý.

```text
AI đưa ra nhiều ý tưởng khác nhau và gợi ý tập trung vào nhóm đối tượng sinh viên IT làm project nhóm, những nhóm thiếu kỹ năng quản lý đội ngũ và ít kinh nghiệm sử dụng nhiều công cụ kiểm soát khác nhau ở nhiều nơi
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

Mô tả rõ phần nào được sử dụng lại từ gợi ý của AI.

```text
Nhóm sử dụng hướng “AI Workspace cho sinh viên IT” để phát triển thành DevTrack AI.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

Mô tả sinh viên/nhóm đã thay đổi, kiểm tra, sửa lỗi hoặc cải tiến gì so với gợi ý ban đầu của AI.

```text
Nhóm tự phân tích lại scope, pain point thực tế và quyết định tập trung vào traceability thay vì task management thông thường.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

Sinh viên/nhóm học được gì sau lần sử dụng AI này?

```text
Nhóm học được cách xác định pain point thật thay vì chỉ nghĩ ra ý tưởng chung chung. Biết phân tích được cách tìm ra vấn đề và hướng đi để giải quyết nó. 
```

---

### Lần sử dụng AI số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng | Phân tích yêu cầu |
| Phần việc liên quan | Requirement / Design |
| Mức độ sử dụng | Hỗ trợ một phần |

#### 4.1. Prompt đã sử dụng

```text
Từ ý tưởng của nhóm, hãy phân tích các requirement cần có của dự án, bên cạnh đó là use case chi tiết. Phân tích cách người dùng sẽ sử dụng hệ thống, từ đó sinh ra use case dựa trên đó. 
```

#### 4.2. Kết quả AI gợi ý

```text
AI tạo ra các requirement cho hệ thống. AI tạo ra nhiều use case, mỗi use case có các kịch bản chi tiết như main flow, alternative flow, postcondition, ...
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Sử dụng các requirement và use case chính.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Từ các requirement và use case đó, nhóm điều chỉnh và thêm mới dựa trên hệ thống thực tế mà nhóm đã thảo luận
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Nhóm hiểu rõ hơn cách hệ thống hoạt động đối với người dùng. Các requirement cần có để hệ thống hoạt động mượt mà các chức năng chính.
```

---

### Lần sử dụng AI số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT |
| Mục đích sử dụng | Thiết kế workflow và ERD |
| Phần việc liên quan | Design / Database |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Đánh giá ERD này và phân tích xem có phù hợp với requirement-centric workflow không.
```

#### 4.2. Kết quả AI gợi ý

```text
AI phân tích các entity chính như Requirement, Task, Test Case, Evidence, RTM và gợi ý cải thiện kiến trúc database.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Nhóm sử dụng các entity và relationship chính để hoàn thiện ERD.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Nhóm tự review lại flow thực tế của sinh viên IT và điều chỉnh role, workflow và requirement ownership.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Nhóm hiểu rõ hơn về cách thiết kế hệ thống theo hướng traceability.
```

---

### Lần sử dụng AI số 4

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT / Stitch |
| Mục đích sử dụng | Thiết kế UI/UX demo |
| Phần việc liên quan | Frontend / Design |
| Mức độ sử dụng | Hỗ trợ nhiều |

#### 4.1. Prompt đã sử dụng

```text
Tạo prompt để Stitch generate UI cho hệ thống DevTrack AI theo role Leader, Member, Mentor. Các thành phần liên kết chặt chẽ với nhau, flow UI logic. 
```

#### 4.2. Kết quả AI gợi ý

```text
AI tạo flow UI theo từng role và chia thành nhiều batch prompt để Stitch xử lý ổn định hơn.
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Nhóm sử dụng các prompt batch để generate prototype UI.
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Nhóm tự điều chỉnh layout task board, navigation flow và hierarchy của sidebar.
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Nhóm học được cách chia nhỏ prompt và mô tả flow rõ ràng để AI tạo kết quả chính xác hơn.
```

---

### Lần sử dụng AI số n

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác |
| Mục đích sử dụng |  |
| Phần việc liên quan | Requirement / Design / Database / Frontend / Backend / Testing / Debug / Report / Presentation / Other |
| Mức độ sử dụng | Hỗ trợ ý tưởng / Hỗ trợ một phần / Hỗ trợ nhiều / Sinh chính nội dung |

#### 4.1. Prompt đã sử dụng

```text
Dán nguyên văn prompt đã hỏi AI tại đây.
```

#### 4.2. Kết quả AI gợi ý

```text
Viết tại đây...
```

#### 4.3. Phần sinh viên/nhóm đã sử dụng từ AI

```text
Viết tại đây...
```

#### 4.4. Phần sinh viên/nhóm tự chỉnh sửa hoặc cải tiến

```text
Viết tại đây...
```

#### 4.5. Minh chứng

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link video demo |  |
| Ghi chú khác |  |

#### 4.6. Nhận xét cá nhân/nhóm

```text
Viết tại đây...
```

---

## 5. Bảng tổng hợp mức độ sử dụng AI

Đánh dấu mức độ AI hỗ trợ ở từng hạng mục.

| Hạng mục | Không dùng AI | AI hỗ trợ ít | AI hỗ trợ nhiều | AI sinh chính | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| Phân tích yêu cầu |  |  | x |  | AI hỗ trợ brainstorm và review |
| Viết user story/use case |  | x |  |  | Nhóm tự chỉnh sửa nhiều |
| Thiết kế database |  |  | x |  | AI hỗ trợ ERD |
| Thiết kế kiến trúc hệ thống |  |  | x |  | AI hỗ trợ architecture |
| Thiết kế giao diện |  |  | x |  | Stitch hỗ trợ prototype |
| Code frontend |  |  |  |  |  |
| Code backend |  |  |  |  |  |
| Debug lỗi |  |  |  |  |  |
| Viết test case |  |  |  |  |  |
| Kiểm thử sản phẩm |  |  |  |  |  |
| Tối ưu code |  |  |  |  |  |
| Viết báo cáo |  |  |  |  |  |
| Làm slide thuyết trình |  |  |  |  |  |


---

## 6. Các lỗi hoặc hạn chế từ AI

Ghi lại các trường hợp AI trả lời sai, thiếu, chưa phù hợp hoặc sinh code không chạy.

| STT | Lỗi/hạn chế từ AI | Cách phát hiện | Cách xử lý/cải tiến |
|---:|---|---|---|
| 1 | Một số flow UI bị thiếu logic | Review user flow | Chia prompt nhỏ hơn cho Stitch |
| 2 | AI gợi ý DB hơi phức tạp | Team review | Giảm scope cho MVP |
| 3 |  |  |  |

---

## 7. Kiểm chứng kết quả AI

Mô tả cách sinh viên/nhóm kiểm tra lại kết quả do AI gợi ý.

Có thể bao gồm:

- Chạy thử chương trình
- Viết test case
- So sánh với yêu cầu đề bài
- Kiểm tra output
- Đối chiếu tài liệu môn học
- Hỏi lại giảng viên
- Review cùng thành viên nhóm
- Kiểm tra lỗi bảo mật
- Kiểm tra bằng dữ liệu mẫu
- So sánh trước và sau khi dùng AI

### Nội dung kiểm chứng

```text
Nhóm kiểm tra kết quả AI bằng cách review requirement với team, đối chiếu với workflow thực tế của sinh viên IT, phân tích tính khả thi trong thời gian 9 tuần và kiểm tra lại kiến trúc hệ thống trước khi áp dụng.
```

---

## 8. Đóng góp cá nhân hoặc đóng góp nhóm

### 8.1. Đối với bài cá nhân

Mô tả phần sinh viên tự làm, phần AI hỗ trợ và phần đã tự cải tiến.

```text
Viết tại đây...
```

### 8.2. Đối với bài nhóm

| Thành viên | MSSV | Nhiệm vụ chính | Có sử dụng AI không? | Minh chứng đóng góp |
|---|---|---|---|---|
| Nguyễn Minh Hiếu | DE200322 | Requirement & Design | Có | Requirement docs |
| Nguyễn Minh Hiếu | DE200322 | Database & Backend | Có | ERD, SQL |
| Nguyễn Minh Hiếu | DE200322 | UI/UX | Có | Stitch prototype |
|  |  |  | Có / Không |  |

---

## 9. Reflection cuối bài

### 9.1. AI đã hỗ trợ em/nhóm ở điểm nào?

```text
Viết tại đây...
```

### 9.2. Phần nào em/nhóm không sử dụng theo gợi ý của AI? Vì sao?

```text
Viết tại đây...
```

### 9.3. Em/nhóm đã kiểm tra tính đúng đắn của kết quả AI như thế nào?

```text
Viết tại đây...
```

### 9.4. Nếu không có AI, phần nào sẽ khó khăn nhất?

```text
Viết tại đây...
```

### 9.5. Sau bài tập/project này, em/nhóm học được gì về môn học?

```text
Viết tại đây...
```

### 9.6. Sau bài tập/project này, em/nhóm học được gì về cách sử dụng AI có trách nhiệm?

```text
Viết tại đây...
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
|  |  |
