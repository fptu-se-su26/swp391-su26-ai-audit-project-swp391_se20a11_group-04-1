# Prompt Log

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
| Ngày cập nhật gần nhất |  |

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
| 1 |  |  |  |  |  | Có / Không |  |
| 2 |  |  |  |  |  | Có / Không |  |
| 3 |  |  |  |  |  | Có / Không |  |
| 4 | 18/05/2026 | Gemini | Tìm giải pháp chống Brute Force tối ưu | Hỏi cách chống brute force và tối ưu hiệu năng DB | Đề xuất Progressive Lockout + Fast-Fail bằng Redis | Có | Commit 8d340e6 |
| 5 | 19/05/2026 | Antigravity | Thiết kế Khóa kép Đa IP & Action Link Email | Yêu cầu lấy thông tin thiết bị, vị trí và tạo nút bấm mở khóa từ Email | Đề xuất phân tích User-Agent, GeoIP API và tạo Secure Token. | Có |  |
| 6 | 19/05/2026 | Gemini | Xử lý Reset Trạng Thái Bảo Mật & Cô lập Hacker | Yêu cầu làm rõ cơ chế xóa đếm lỗi và khóa IP | Đề xuất cơ chế Security State Reset thông minh, chỉ xóa IP thật. | Có |  |
| 7 | 20/05/2026 | Gemini | Bảo mật Token GitHub (OAuth 2.0) & Encryption | Cách lưu trữ token an toàn và xử lý lỗi 401 | Đề xuất mã hóa AES, log an toàn và luồng re-link. | Có |  |
| 8 | 20/05/2026 | Antigravity | Đồng bộ GitHub Issues & Logic duyệt Task | Xử lý Webhook rác và chặn cập nhật trạng thái láo | Đề xuất Fast-Fail Webhook và State Machine chặn HTTP 400. | Có |  |
| 9 |  |  |  |  |  | Có / Không |  |
| 10 |  |  |  |  |  | Có / Không |  |

---

## 5. Prompt chi tiết

> Sinh viên/nhóm có thể nhân bản mẫu “Prompt số...” nhiều lần tùy số lượng prompt thực tế đã sử dụng.

---

### Prompt số 1

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác |
| Mục đích |  |
| Phần việc liên quan | Requirement / Design / Database / Coding / Testing / Debug / Report / Presentation / Other |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi giải thích / Hỏi review / Hỏi debug / Hỏi sinh code / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
Dán nguyên văn prompt đã hỏi AI tại đây.
```

#### 5.2. Bối cảnh khi viết prompt

Mô tả ngắn gọn vì sao sinh viên/nhóm cần dùng prompt này.

```text
Viết tại đây...
```

#### 5.3. Kết quả AI trả về

Tóm tắt nội dung AI đã trả lời hoặc gợi ý.

```text
Viết tại đây...
```

#### 5.4. Kết quả đã áp dụng vào bài

Mô tả phần nào từ kết quả AI đã được sử dụng vào bài tập/project.

```text
Viết tại đây...
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

Mô tả sinh viên/nhóm đã thay đổi, kiểm tra, sửa lỗi hoặc cải tiến gì so với kết quả AI trả về.

```text
Viết tại đây...
```

#### 5.6. Đánh giá chất lượng prompt

Đánh dấu các nhận xét phù hợp.

- [ ] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [ ] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link tài liệu/báo cáo |  |
| Ghi chú khác |  |

#### 5.8. Ghi chú thêm

```text
Viết tại đây...
```

---

### Prompt số 2

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác |
| Mục đích |  |
| Phần việc liên quan | Requirement / Design / Database / Coding / Testing / Debug / Report / Presentation / Other |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi giải thích / Hỏi review / Hỏi debug / Hỏi sinh code / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
Dán nguyên văn prompt đã hỏi AI tại đây.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Viết tại đây...
```

#### 5.3. Kết quả AI trả về

```text
Viết tại đây...
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Viết tại đây...
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Viết tại đây...
```

#### 5.6. Đánh giá chất lượng prompt

- [ ] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [ ] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link tài liệu/báo cáo |  |
| Ghi chú khác |  |

#### 5.8. Ghi chú thêm

```text
Viết tại đây...
```

---

### Prompt số 3

| Nội dung | Thông tin |
|---|---|
| Ngày sử dụng |  |
| Công cụ AI | ChatGPT / Gemini / Claude / GitHub Copilot / Cursor / Antigravity / Khác |
| Mục đích |  |
| Phần việc liên quan | Requirement / Design / Database / Coding / Testing / Debug / Report / Presentation / Other |
| Mức độ sử dụng | Hỏi ý tưởng / Hỏi giải thích / Hỏi review / Hỏi debug / Hỏi sinh code / Hỏi tối ưu |

#### 5.1. Prompt nguyên văn

```text
Dán nguyên văn prompt đã hỏi AI tại đây.
```

#### 5.2. Bối cảnh khi viết prompt

```text
Viết tại đây...
```

#### 5.3. Kết quả AI trả về

```text
Viết tại đây...
```

#### 5.4. Kết quả đã áp dụng vào bài

```text
Viết tại đây...
```

#### 5.5. Phần sinh viên/nhóm đã chỉnh sửa hoặc cải tiến

```text
Viết tại đây...
```

#### 5.6. Đánh giá chất lượng prompt

- [ ] Prompt rõ ràng
- [ ] Prompt có đủ bối cảnh
- [ ] Prompt còn thiếu thông tin
- [ ] Prompt tạo ra kết quả tốt
- [ ] Prompt tạo ra kết quả chưa phù hợp
- [ ] Cần hỏi lại AI nhiều lần
- [ ] Cần tự kiểm tra và chỉnh sửa nhiều
- [ ] Kết quả AI có lỗi hoặc chưa chính xác

#### 5.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| Link commit |  |
| File liên quan |  |
| Screenshot |  |
| Kết quả chạy/test |  |
| Link tài liệu/báo cáo |  |
| Ghi chú khác |  |

#### 5.8. Ghi chú thêm

```text
Viết tại đây...
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
- [x] Prompt tạo ra kết quả tốt
- [x] Cần tự kiểm tra và chỉnh sửa nhiều (phản biện lại AI)

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
| Công cụ AI | Antigravity |
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
- [x] Prompt tạo ra kết quả tốt
- [x] Cần tự kiểm tra và chỉnh sửa nhiều (phản biện lại AI)

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
- [x] Prompt tạo ra kết quả tốt
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

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
- [x] Prompt tạo ra kết quả tốt
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

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
| Công cụ AI | Antigravity |
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
- [x] Prompt tạo ra kết quả tốt
- [x] Cần tự kiểm tra và chỉnh sửa nhiều

#### 8.7. Minh chứng liên quan

| Loại minh chứng | Nội dung |
|---|---|
| File liên quan | TaskServiceImpl.java, GithubWebhookController.java |

#### 8.8. Ghi chú thêm

```text
Sự phản biện mạnh mẽ và việc đặt mình vào vị trí "Domain Expert" là bắt buộc để LLM không phá hỏng Business Logic của dự án.
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
