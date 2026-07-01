# AI Learning Reflection

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
| Ngày hoàn thành reflection | 30/06/2026 |

---

## 2. Mục đích Reflection

File này dùng để sinh viên/nhóm tự đánh giá quá trình sử dụng AI trong học tập và thực hiện bài tập, lab, assignment hoặc project.

Reflection cần thể hiện:

- AI đã hỗ trợ gì trong quá trình học.
- Sinh viên/nhóm đã kiểm chứng kết quả AI như thế nào.
- Sinh viên/nhóm đã tự chỉnh sửa, cải tiến ra sao.
- Sinh viên/nhóm học được gì về môn học.
- Sinh viên/nhóm học được gì về cách sử dụng AI minh bạch và có trách nhiệm.

---

## 3. Tóm tắt quá trình sử dụng AI

Mô tả ngắn gọn quá trình sử dụng AI trong bài tập/project này.

```text
Trong project này, em sử dụng AI (Gemini) từ giai đoạn thiết kế kiến trúc bảo mật cho đến triển khai tính năng và debug lỗi. Gemini được dùng nhiều nhất để tư vấn cấu hình Spring Security, sinh mã nguồn DTO/Mapper và hỗ trợ phân tích nguyên nhân các lỗi kết nối mạng. AI giúp rút ngắn 50% thời gian code, tuy nhiên em phải tự mình phản biện, tinh chỉnh sâu để giải quyết các lỗi logic bảo mật phức tạp.
```

Gợi ý:

- Em/nhóm đã dùng AI ở giai đoạn nào?
- Dùng AI để hỗ trợ việc gì?
- Công cụ AI nào được sử dụng nhiều nhất?
- AI có giúp cải thiện chất lượng bài làm không?
- Có phần nào AI gợi ý nhưng em/nhóm không sử dụng không?

---

## 4. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng.

- [ ] ChatGPT
- [x] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [ ] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [ ] Công cụ khác: ....................................

### Công cụ được sử dụng nhiều nhất

```text
Gemini
```

### Lý do sử dụng công cụ đó

```text
Khả năng đọc hiểu ngữ cảnh lớn tốt, hỗ trợ sinh mã nguồn cấu trúc và gợi ý phương án cấu hình Spring Boot/Spring Security nhanh chóng.
```

---

## 5. AI đã hỗ trợ em/nhóm ở điểm nào?

Đánh dấu các nội dung phù hợp.

- [x] Hiểu yêu cầu đề bài
- [x] Phân tích bài toán
- [x] Tìm ý tưởng giải pháp
- [x] Thiết kế database
- [x] Thiết kế giao diện
- [x] Thiết kế kiến trúc hệ thống
- [x] Viết code mẫu
- [x] Debug lỗi
- [x] Viết test case
- [x] Review code
- [x] Tối ưu code
- [x] Kiểm tra bảo mật
- [x] Viết báo cáo
- [ ] Chuẩn bị thuyết trình
- [x] Tìm hiểu công nghệ mới
- [ ] Khác: ....................................

### Mô tả chi tiết

```text
Hỗ trợ viết mã nguồn boilerplate (các lớp Model, Repository, DTO, Mapper, Configurations) nhanh chóng. Đồng thời đưa ra hướng đi về mặt giải pháp kiến trúc ban đầu (chọn cơ chế token mở khóa gửi qua mail, cấu hình upload Cloudinary, cách thiết lập SSE Emitter).
```

---

## 6. Hạn chế của AI và mức độ phụ thuộc

### 6.1. Hạn chế của AI đã gặp phải trong bài tập/project này

Đánh dấu các hạn chế đã gặp.

- [x] AI gợi ý code sai cú pháp hoặc lỗi logic
- [x] AI không hiểu đúng nghiệp vụ hoặc ngữ cảnh của bài
- [x] AI đưa giải pháp quá phức tạp không cần thiết
- [ ] AI trả lời chung chung không giải quyết được vấn đề
- [ ] AI bị lỗi kết nối hoặc không phản hồi
- [ ] Khác: ....................................

### 6.2. Mô tả cụ thể hạn chế đã gặp và cách xử lý

```text
- AI đề xuất dùng IP Blocking nhưng làm ảnh hưởng xấu đến UX mạng doanh nghiệp và DoS DB. Em xử lý bằng cách chuyển sang Redis đếm lỗi theo IP kết hợp Account-based lock.
- AI đề xuất lưu đơn kháng cáo trực tiếp trên user_accounts gây mất lịch sử, em phản biện và tách thành bảng riêng biệt `user_appeals`.
- AI đề xuất dùng CAST JPQL cho custom enum PostgreSQL gây crash Hibernate compiler, em tự sửa bằng Query Specialization ở Java.
- AI đề xuất cơ chế block tài khoản thụ động, em sửa thành thu hồi Session thời gian thực bằng SessionRegistryListener trên Redis và gửi WebSocket.
```

### 6.3. Em/nhóm có bị phụ thuộc vào AI không?

- [ ] Không phụ thuộc
- [x] Phụ thuộc ít
- [ ] Phụ thuộc trung bình
- [ ] Phụ thuộc nhiều

Giải thích:

```text
Em chỉ sử dụng AI như một trợ lý viết code lặp đi lặp lại và tư vấn ý tưởng ban đầu. Mọi quyết định thiết kế nghiệp vụ, tinh chỉnh bảo mật và sửa lỗi môi trường đều do em tự nghiên cứu và chịu trách nhiệm.
```

---

## 7. Em/nhóm đã kiểm tra kết quả AI như thế nào?

Đánh dấu các cách đã sử dụng.

- [x] Chạy thử chương trình
- [x] Kiểm tra output
- [x] Viết test case
- [x] So sánh với yêu cầu đề bài
- [x] Đối chiếu với tài liệu môn học
- [x] Review code
- [ ] Hỏi lại giảng viên
- [ ] Tra cứu tài liệu chính thống
- [ ] Thảo luận với thành viên nhóm
- [ ] Kiểm tra bằng dữ liệu mẫu
- [ ] So sánh trước và sau khi dùng AI
- [ ] Khác: ....................................

### Mô tả quá trình kiểm chứng

```text
Mọi đoạn mã do AI sinh ra đều được chạy thử E2E cục bộ, theo dõi log câu lệnh SQL xuất xuống database xem có đúng và tối ưu chưa. Viết thêm kiểm thử đa luồng (Concurrency Test) cho cơ chế Distributed Lock để phát hiện race condition.
```

### Ví dụ cụ thể về một lần kiểm chứng

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Sử dụng cú pháp CAST JPQL trực tiếp để so sánh Null của Custom Enum dưới PostgreSQL. |
| Em/nhóm đã kiểm tra bằng cách nào? | Chạy thử ứng dụng Spring Boot và gọi API lọc danh sách dự án. |
| Kết quả kiểm tra | Cần chỉnh sửa (Gây lỗi crash Hibernate Parser do không hiểu Custom Type). |
| Em/nhóm đã xử lý tiếp như thế nào? | Tách câu truy vấn thành các hàm đơn giản ở Repository (Query Specialization) để xử lý logic rẽ nhánh ở Java thay vì gộp chung vào SQL. |

---

## 8. Ví dụ AI gợi ý sai hoặc chưa phù hợp

Ghi lại ít nhất một ví dụ nếu có.

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất dùng IP Blocking để chống Brute-force. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Vì sẽ chặn nhầm toàn bộ người dùng hợp lệ trong mạng LAN/NAT của công ty nếu có một người gõ sai. Hơn nữa, truy vấn DB liên tục sẽ gây DoS. |
| Em/nhóm phát hiện bằng cách nào? | Dựa vào kiến thức về kiến trúc mạng thực tế và hiệu năng DB. |
| Em/nhóm đã sửa như thế nào? | Phản biện AI và yêu cầu chuyển sang Account-based Blocking sử dụng Redis, kết hợp Fast-Fail. |
| Bài học rút ra | Luôn phải đối chiếu giải pháp của AI với môi trường thực tế (Production), không áp dụng máy móc. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI cung cấp bộ phân tích User-Agent nhận diện thiết bị nhưng lại nhận diện iPhone là Macbook. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Tưởng chừng thư viện bị lỗi, nhưng thực chất là do tính năng "Request Desktop Website" mặc định của Apple iOS 13+ làm sai lệch thông tin User-Agent gửi lên server. |
| Em/nhóm phát hiện bằng cách nào? | Test thực tế việc đăng nhập sai trên điện thoại iPhone và kiểm tra email cảnh báo trả về. |
| Em/nhóm đã sửa như thế nào? | Hỏi lại AI về hiện tượng lạ này. Sau khi AI giải thích, nhóm đã tắt tính năng giả lập máy tính trên Safari/Chrome điện thoại và nhận diện lại thành công. |
| Bài học rút ra | Không phải lúc nào code hoặc thư viện cũng lỗi, đôi khi nguyên nhân đến từ đặc tả kỹ thuật ẩn của các nền tảng thiết bị đầu cuối (như Apple). Kiến thức sâu rộng của AI về các ngoại lệ này rất hữu ích. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI ban đầu gợi ý logic xóa toàn bộ Key đếm lỗi trên Redis khi người dùng đăng nhập thành công. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Vì việc xóa toàn bộ Key sẽ vô tình "ân xá" (mở khóa) cho cả các địa chỉ IP của Hacker đang bị khóa. |
| Em/nhóm phát hiện bằng cách nào? | Đặt câu hỏi phản biện sắc bén: "Tức là ở đây là máy hacker có xóa không hay xóa hết?" |
| Em/nhóm đã sửa như thế nào? | Cùng AI thống nhất chuyển cấu trúc lưu trữ sang Redis Hash để xóa chính xác đếm lỗi của IP chính chủ, cô lập hoàn toàn IP độc hại. |
| Bài học rút ra | Khi xử lý dữ liệu chung của một tài khoản nhưng có nhiều tác nhân (nhiều IP), cần cấu trúc dữ liệu dạng Hash/Map để cô lập thao tác. Không nên mù quáng xóa toàn cục (Global Reset). |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Ban đầu AI tạo ra API update trạng thái Task hoàn toàn tự do (CRUD cơ bản), cho phép đổi trạng thái trực tiếp thành DONE. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Vi phạm nghiệp vụ kinh doanh (Business Logic) cốt lõi của dự án là "Review Gate" - Mentor phải duyệt trước khi DONE. |
| Em/nhóm phát hiện bằng cách nào? | Đánh giá luồng đi của Task và thử dùng Postman bắn API cập nhật láo trạng thái. |
| Em/nhóm đã sửa như thế nào? | Cung cấp lại định nghĩa quy trình duyệt cho AI và yêu cầu viết một State Machine (máy trạng thái) ràng buộc HTTP 400 nếu vượt rào. |
| Bài học rút ra | Các mô hình ngôn ngữ lớn (LLM) thường bỏ qua Business Logic đặc thù và chỉ làm theo chuẩn RESTful CRUD. Dev phải đóng vai trò là Domain Expert để thiết lập các rào cản nghiệp vụ (Guardrails) ngay tại Controller/Service. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất logic tham gia lớp học (joinClassroom) mà không có cơ chế concurrency control, dẫn đến nguy cơ đua dữ liệu (race condition) khi nhiều học sinh join lớp cùng lúc. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Nếu nhiều học sinh join cùng lúc, số lượng học sinh thực tế được lưu vào cơ sở dữ liệu có thể vượt quá giới hạn `maxMembers` của lớp học (do các luồng đọc đồng thời đều thấy lớp chưa đầy và cho phép join). |
| Em/nhóm phát hiện bằng cách nào? | Viết test case concurrency giả lập 10 học sinh join đồng thời vào lớp học có giới hạn 5 người. |
| Em/nhóm đã sửa như thế nào? | Yêu cầu AI tích hợp Redis-based Distributed Lock để khóa tài nguyên lớp học theo ID trong thời gian ngắn (1s). Tự chỉnh sửa bằng cách chuyển sang bọc logic trong TransactionTemplate để nhả lock ở ngoài transaction boundary, tránh nhả lock trước khi DB commit. |
| Bài học rút ra | Khi làm việc với các giới hạn số lượng (capacity limits) trong môi trường phân tán hoặc đa luồng, việc sử dụng các cơ chế đồng bộ hoặc Distributed Lock là bắt buộc để đảm bảo tính toàn vẹn dữ liệu. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất logic phê duyệt Đề xuất và Đồng bộ Task lên GitHub chỉ dựa vào quyền của Leader hoặc người tạo (Creator) phê duyệt đơn phương. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Vi phạm nghiêm trọng triết lý làm việc nhóm của em: toàn bộ thành viên phải cùng có trách nhiệm với hệ thống và các thay đổi được sync lên GitHub. Không cho phép một cá nhân tự ý đưa các thay đổi chưa qua thảo luận và thống nhất lên kho lưu trữ chung. |
| Em/nhóm phát hiện bằng cách nào? | Đánh giá lại quy trình làm việc nhóm (Team Workflow) và thảo luận trong nhóm về tính dân chủ, minh bạch khi quản lý task. |
| Em/nhóm đã sửa như thế nào? | Phản biện AI và yêu cầu chuyển đổi sang mô hình biểu quyết dân chủ: Bắt buộc tối thiểu 2/3 số thành viên trong nhóm phải tham gia vote và số lượng upvote phải lớn hơn downvote thì mới cho phép phê duyệt và đồng bộ. |
| Bài học rút ra | Khi thiết kế các hệ thống làm việc cộng tác (Collaboration Tools), logic nghiệp vụ cần phản ánh đúng văn hóa làm việc và tinh thần chia sẻ trách nhiệm của tổ chức, tránh thiết kế phân quyền độc đoán. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất dùng giao thức WebSockets hai chiều để truyền thông báo realtime phê duyệt tới Admin, đồng thời khuyên lưu ảnh thẻ giảng viên công khai trên Cloudinary/S3 và trả URL trực tiếp cho Client hiển thị. |
| Vì sao gợi ý đó sai/chưa phù hợp? | 1. WebSockets là dư thừa (over-engineered) cho kịch bản thông báo một chiều từ Server -> Admin, gây lãng phí tài nguyên bắt tay (handshake) và quản lý ping-pong. <br/> 2. Việc phơi bày URL ảnh thẻ giảng viên công khai tạo ra lỗ hổng bảo mật nghiêm trọng (IDOR/Direct access), cho phép bất kỳ ai đoán được URL đều xem trộm được thông tin cá nhân nhạy cảm của giảng viên. |
| Em/nhóm phát hiện bằng cách nào? | Đánh giá kiến trúc truyền tin realtime (chỉ cần server-push một chiều) và thực hiện kiểm tra an toàn thông tin cá nhân trong dự án. |
| Em/nhóm đã sửa như thế nào? | Phản biện lại AI, chuyển hướng sang dùng Server-Sent Events (SSE) để kết nối nhẹ hơn. Đồng thời lưu trữ ảnh ở thư mục Private và triển khai một Proxy Endpoint ở Backend kiểm soát quyền `if (!"ADMIN".equals(userRole) && !request.getUser().getId().equals(userId))` trước khi truyền stream ảnh nhạy cảm về. |
| Bài học rút ra | Lựa chọn giải pháp công nghệ đơn giản, đúng nhu cầu (như SSE thay vì WebSocket cho thông báo một chiều) giúp hệ thống tối giản. Đồng thời dữ liệu nhạy cảm của người dùng (ảnh thẻ) bắt buộc phải được bảo vệ qua lớp Proxy Authorization thay vì lưu trữ công khai. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất một component Carousel tĩnh hiển thị thông báo với màu sắc banner đơn điệu và tải toàn bộ thông báo cũ từ trước đến nay mà không lọc theo thời gian. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Giao diện tĩnh đơn sắc làm người dùng cảm thấy đơn điệu, nhàm chán. Đồng thời, hiển thị các thông báo quá cũ (vài tháng trước) gây loãng thông tin và spam trải nghiệm học tập của học sinh. |
| Em/nhóm phát hiện bằng cách nào? | Đánh giá trực quan về giao diện người dùng (UI-UX Review) và phản hồi từ các thành viên nhóm về việc bộ lọc thông tin bị loãng. |
| Em/nhóm đã sửa như thế nào? | Thiết lập map chuyển sắc màu gradient đa dạng theo từng mức độ quan trọng (đỏ cho khẩn cấp/cảnh báo, lục cho thành công, xanh dương cho lớp học). Lọc thông tin trên carousel chỉ giữ lại thông báo trong vòng 7 ngày gần nhất. |
| Bài học rút ra | Giao diện đẹp và trải nghiệm người dùng tinh tế (UI/UX) đóng vai trò quyết định sự hài lòng của sản phẩm. Việc hiển thị thông tin có bộ lọc thời gian giúp tăng độ tập trung cho người học. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất logic tính toán Dashboard thống kê các chỉ số sĩ số, số task xong, số commit bằng cách count JPA cơ bản, nhưng bỏ qua Line Chart bị lệch/vỡ định dạng khi một project có ngày không có commit nào. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Nếu một dự án có ngày không hoạt động, Line Chart biểu đồ tuần sẽ bị khuyết thiếu điểm dữ liệu (gây crash hoặc hiển thị lệch cột). Đồng thời, heatmap 365 ngày của project không có cơ chế gom nhóm/group-by theo ngày ở SQL làm frontend không thể vẽ được bản đồ đóng góp. |
| Em/nhóm phát hiện bằng cách nào? | Chạy thử Dashboard với dữ liệu thực tế và kiểm tra console log phía frontend phát hiện lỗi khuyết thiếu dữ liệu Line Chart. |
| Em/nhóm đã sửa như thế nào? | Viết thuật toán bổ sung giá trị mặc định 0 (`putIfAbsent`) cho các project trống commit trong tuần ở Backend. Viết câu truy vấn map gom nhóm theo ngày (`findCommitDatesByProject`) để cung cấp Map dữ liệu hoàn chỉnh cho biểu đồ Heatmap. |
| Bài học rút ra | Dữ liệu thô từ database luôn cần được chuẩn hóa (clean và fill zeros) trước khi cung cấp cho các thư viện biểu đồ phía Client để tránh lỗi hiển thị. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất sử dụng stream upload thông thường của Cloudinary để tải tài liệu lên (tải toàn bộ file vào RAM máy chủ trước khi đẩy lên Cloud Storage) và bỏ qua tài nguyên dạng đường dẫn liên kết (Link). |
| Vì sao gợi ý đó sai/chưa phù hợp? | 1. Khi tải lên các file tài liệu lớn (từ 6MB đến 10MB) với mạng không ổn định, việc buffer toàn bộ file vào RAM sẽ gây lỗi OutOfMemory (JVM) và dễ timeout. <br/> 2. Giáo viên/học sinh có nhu cầu chia sẻ link online (như Google Drive, Figma) mà không cần upload file vật lý, nhưng gợi ý của AI thiếu loại hình tài nguyên này. Đồng thời, nếu là tài nguyên dạng Link thì không thể tải nén ZIP, hệ thống phải chặn lại để tránh lỗi zip rác. |
| Em/nhóm phát hiện bằng cách nào? | Thực hiện kiểm thử hiệu năng tải lên (Load Testing) với file 9MB và rà soát nghiệp vụ chia sẻ link tài liệu học tập của môn học. |
| Em/nhóm đã sửa như thế nào? | Phản biện AI để dùng Cloudinary Chunked Upload (`uploadLarge` chunk size 6MB), stream trực tiếp từ file input. Đồng thời viết thêm `addLinkResource` (lưu URL link liên kết) và tại API download, thêm ràng buộc `if (resource.getType() != ResourceType.FILE) throw new BusinessException("Không thể tải xuống tài liệu dạng link");` để chặn zip tài nguyên link. |
| Bài học rút ra | Đối với các tác vụ xử lý file dung lượng lớn, việc áp dụng cơ chế stream và chunked upload là bắt buộc để đảm bảo sự ổn định của hệ thống máy chủ và tránh nghẽn băng thông. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất lưu các trường kháng cáo (appeal_reason, appeal_evidence_url) trực tiếp trên bảng `user_accounts` để đơn giản hóa cơ sở dữ liệu. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Vi phạm nguyên tắc chuẩn hóa dữ liệu. Nếu tài khoản bị khóa và mở khóa nhiều lần trong lịch sử, việc ghi đè trực tiếp sẽ làm mất hoàn toàn lịch sử kháng cáo trước đó. |
| Em/nhóm phát hiện bằng cách nào? | Đánh giá thiết kế hệ thống lâu dài và phân tích trường hợp người dùng tái vi phạm. |
| Em/nhóm đã sửa như thế nào? | Phản biện AI và yêu cầu tách thành bảng độc lập `user_appeals` liên kết 1-n với `user_accounts`, viết migration Flyway để đồng bộ. |
| Bài học rút ra | Khi lưu trữ dữ liệu mang tính lịch sử (như logs, lịch sử phê duyệt, kháng cáo), bắt buộc phải thiết kế bảng riêng, không lạm dụng gom chung vào thực thể chính để tránh mất dữ liệu. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất cơ chế block tài khoản thụ động: Chỉ đổi trạng thái `isActive = false` trong DB và chờ request tiếp theo của Client để kiểm tra quyền truy cập. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Thiếu tính bảo mật thời gian thực. Phiên đăng nhập (Session) cũ của người dùng vẫn đang có hiệu lực trên Redis/RAM, hacker vẫn có thể tiếp tục thao tác trái phép cho đến khi session tự hết hạn. |
| Em/nhóm phát hiện bằng cách nào? | Thử nghiệm thực tế: Block tài khoản từ trang Admin và dùng tab ẩn danh của user cũ để gọi API, nhận thấy API vẫn trả về dữ liệu 200 OK bình thường. |
| Em/nhóm đã sửa như thế nào? | Triển khai lớp `SessionRegistryListener` để lưu vết session. Khi Admin click khóa tài khoản, Service chủ động thu hồi (invalidate) Session của user đó trên Redis ngay lập tức. Đồng thời phát tín hiệu WebSocket để React hiển thị LockOverlay khóa cứng UI mà không cần tải lại trang. |
| Bài học rút ra | Các hệ thống bảo mật cấp độ doanh nghiệp yêu cầu cơ chế thu hồi quyền hạn chủ động (Active Revocation) ở mức thời gian thực. Việc chỉ dựa vào DB status thụ động là một lỗ hổng bảo mật nghiêm trọng. |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất ép kiểu trực tiếp trong JPQL: `CAST(:status AS project_status_enum)` hoặc chuyển cấu trúc Entity sang `@Enumerated(EnumType.STRING)`. |
| Vì sao gợi ý đó sai/chưa phù hợp? | 1. Việc sử dụng `CAST` trực tiếp trong JPQL làm crash bộ biên dịch của Hibernate vì Hibernate Parser không nhận diện được kiểu dữ liệu tùy biến của PostgreSQL. <br/> 2. Việc chuyển sang `@Enumerated(EnumType.STRING)` thất bại khi ghi đè vì Postgres Driver chặn đứng dữ liệu dạng String khi đối chiếu với cột ENUM vật lý. |
| Em/nhóm phát hiện bằng cách nào? | Đọc chi tiết log lỗi JDBC driver và chạy kiểm thử truy vấn trực tiếp dưới Database. |
| Em/nhóm đã sửa như thế nào? | Phản biện lại các giải pháp ép kiểu của AI. Tách truy vấn ở Repository thành 4 phương thức độc lập chuyên biệt (Query Specialization) để xử lý logic rẽ nhánh ở tầng Java thay việc gộp chung vào SQL. |
| Bài học rút ra | JPA/Hibernate có những hạn chế nhất định khi tương tác với các kiểu dữ liệu tùy biến (Custom Types) của hệ quản trị cơ sở dữ liệu. Không nên lạm dụng các hàm ép kiểu phức tạp trong JPQL mà nên xử lý rẽ nhánh logic ở tầng ứng dụng (Java). |

<br/>

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI đề xuất cơ chế Thu hồi (Revoke) chỉ cần cập nhật trạng thái đơn xác thực thành `CANCELLED` trong database. |
| Vì sao gợi ý đó sai/chưa phù hợp? | 1. Thiếu tính bảo mật: Nếu chỉ đổi trạng thái đơn mà không hạ vai trò hệ thống (System Role) của người dùng từ MENTOR về lại USER, họ vẫn giữ nguyên mọi đặc quyền trên hệ thống (như tạo lớp học, xem tài liệu). <br/> 2. Không dọn dẹp file nhạy cảm: Giữ lại ảnh thẻ riêng tư trên Cloudinary gây rò rỉ dữ liệu cá nhân. <br/> 3. Trùng lặp endpoint API SSE stream với API lấy danh sách thông thường gây xung đột định tuyến. |
| Em/nhóm phát hiện bằng cách nào? | Đánh giá vòng đời quản lý quyền hạn (Access Control Lifecycle) và kiểm thử định tuyến API trên môi trường Spring Boot. |
| Em/nhóm đã sửa như thế nào? | Phản biện AI để thực thi hạ cấp vai trò, xóa tệp private vật lý trên Cloudinary, đẩy tin nhắn WebSocket realtime cảnh báo Mentor rụng quyền, và tách biệt API SSE sang đường dẫn `/stream` riêng. |
| Bài học rút ra | Thu hồi quyền hạn (Revocation) phải là một quy trình khép kín bao gồm: hạ cấp vai trò, ngắt phiên hoạt động, xóa dữ liệu nhạy cảm vật lý, tránh việc "thu hồi trên giấy tờ" nhưng quyền hạn thực tế vẫn còn. |

---

## 9. Phần đóng góp thật sự của sinh viên/nhóm

Mô tả rõ phần nào là đóng góp chính của sinh viên/nhóm, không phải chỉ copy từ AI.

- Tự phân tích yêu cầu nghiệp vụ lớp học (Classroom) và cấu trúc phân rã database (academic_contexts, classroom_members).
- Phản biện sắc bén với các gợi ý sơ sài của AI: từ chối sinh link plain-text để tránh IDOR; so sánh tính khả thi của JWT với AES-128 và quyết định chọn AES vì lý do tối ưu hiệu suất và gọn nhẹ; đề xuất giải thuật chia nhóm dạng Hybrid để giữ lại tiến trình làm việc của các nhóm cũ.
- Tự nghiên cứu và giải quyết lỗi bất đồng bộ của Distributed Lock trong môi trường transaction (nhả lock ở TransactionTemplate ngoài cùng thay vì dùng @Transactional tại method), đảm bảo an toàn tuyệt đối khi nhiều luồng truy cập đồng thời.
- Thiết kế hệ thống kiểm thử tự động ClassroomServiceConcurrencyTest để kiểm chứng an toàn concurrency.
- Lên ý tưởng và trực tiếp phản biện AI để áp dụng luật biểu quyết 2/3 cho Task Proposal & Sync, xuất phát từ tư duy toàn bộ thành viên nhóm phải cùng chia sẻ trách nhiệm quản trị hệ thống và chất lượng code chung, ngăn chặn hành vi lạm quyền duyệt đơn phương.
- Phân tích kiến trúc truyền tin realtime để lựa chọn Server-Sent Events (SSE) giúp tối ưu tài nguyên mạng thay vì giải pháp WebSockets cồng kềnh; đồng thời đề xuất và tự xây dựng lớp bảo mật Proxy Endpoint tại Controller để chặn IDOR đối với ảnh thẻ giảng viên riêng tư.
- Thiết kế giao diện và logic lọc tin của AnnouncementCarousel kết hợp màu nền gradient chuyển sắc sinh động, tự động dừng lướt tin khi di chuột và chỉ lấy thông báo trong 7 ngày gần nhất để giữ độ tập trung thông tin.
- Chuẩn hóa dữ liệu khuyết thiếu (fill zeros) cho biểu đồ Line Chart hoạt động trong tuần ở Backend và tự phát triển cơ chế gom nhóm dữ liệu đóng góp 365 ngày vẽ đồ thị Heatmap đóng góp cho từng dự án.
- Nghiên cứu cơ chế truyền tải file tối ưu, áp dụng Cloudinary Chunked Upload (`uploadLarge` với chunk size 6MB) kết hợp bộ lọc Whitelist định dạng và giới hạn dung lượng 10MB để bảo toàn bộ nhớ RAM máy chủ; tự phát triển cơ chế đóng gói zip động kèm thư mục tạm cho client khi tải tài nguyên về.
- Tự nghiên cứu cơ chế trục xuất Session thời gian thực (Active Session Revocation) bằng việc lưu vết và invalidation session qua Redis, kết hợp truyền trạng thái khóa qua WebSocket để hiển thị LockOverlay khóa UI React tức thời khi Admin block tài khoản.
- Tách biệt và chuẩn hóa hệ thống kháng cáo (Appeals) sang bảng riêng biệt để lưu trữ lịch sử lâu dài, đồng thời đưa endpoint upload tài liệu minh chứng ra ngoài cổng bảo mật (permitAll) phục vụ cho tài khoản đã bị khóa.
- Tự thiết kế giao diện Admin Phê duyệt Mentor nhóm theo người dùng giúp tránh spam bảng điều khiển, tích hợp nút "Thu hồi" (Revoke) hiển thị động cùng Popup nhập lý do để làm dữ liệu đối soát lịch sử.
- Triển khai thuật toán đếm số lớp học sở hữu (`classroomCount`) của giảng viên trực tiếp tại Backend và hiển thị lên danh sách duyệt để giúp Admin có dữ liệu thực tế đánh giá thâm niên trước khi duyệt đơn.


Gợi ý:

- Tự phân tích yêu cầu.
- Tự chọn giải pháp.
- Tự chỉnh sửa code.
- Tự kiểm tra output.
- Tự thiết kế logic.
- Tự sửa lỗi.
- Tự viết báo cáo theo hiểu biết của mình.
- Tự đánh giá ưu/nhược điểm của sản phẩm.
- Tự thuyết trình và giải thích sản phẩm.

---

## 10. So sánh trước và sau khi dùng AI

| Nội dung | Trước khi dùng AI | Sau khi dùng AI | Cải thiện đạt được |
|---|---|---|---|
| Hiểu yêu cầu | Phải đọc tài liệu nghiệp vụ nhiều lần để hình dung luồng đi của tính năng. | Nắm bắt nhanh các yêu cầu chung, được AI tóm tắt sơ đồ Use Case. | Tiết kiệm 40% thời gian phân tích nghiệp vụ ban đầu. |
| Phân tích bài toán | Khó lường trước các vấn đề bảo mật phức tạp như mạng NAT, IDOR hoặc race condition. | Được AI cảnh báo các nguy cơ tấn công Brute-force, IDOR và rủi ro rò rỉ token. | Xây dựng được tư duy phòng thủ (Defensive Design) cho ứng dụng. |
| Thiết kế giải pháp | Thường chọn giải pháp đơn giản nhất (như synchronized, Plain-text ID, IP Blocking). | Đề xuất giải pháp tối ưu hơn (Redis Lock, AES-128 Token, Account-based lock). | Nâng tầm kiến trúc hệ thống đạt chuẩn môi trường phân tán/Production. |
| Code/Implementation | Mất nhiều thời gian viết code boilerplate (DTOs, Mappers, Configurations). | AI sinh code mẫu nhanh chóng, chỉ cần tập trung viết logic nghiệp vụ chính. | Tốc độ hoàn thành tính năng nhanh gấp 2 lần. |
| Debug/Testing | Chủ yếu test thủ công bằng giao diện hoặc Postman thông thường. | Được AI hướng dẫn viết các Test Case concurrency và unit test chi tiết. | Phát hiện sớm các lỗi race condition tiềm ẩn dưới DB. |
| Báo cáo/Thuyết trình | Tự soạn thảo báo cáo, slide theo mẫu thông thường. | AI hỗ trợ tóm tắt ý chính và đề xuất cấu trúc slide logic, rõ ràng hơn. | Báo cáo có chiều sâu kỹ thuật và tính chuyên nghiệp cao hơn. |
| Làm việc nhóm | Chia việc thủ công qua chat, khó theo dõi tiến độ chi tiết. | Sử dụng AI để lập kế hoạch công việc và phân chia module rõ ràng. | Quản lý tiến độ tốt hơn, giảm thiểu xung đột code khi merge. |

---

## 11. Bài học về môn học

Sau bài tập/project này, em/nhóm học được gì về kiến thức môn học?

```text
Hiểu sâu sắc về sự khác biệt giữa "Code chạy được" và "Kiến trúc hệ thống". Việc tối ưu hiệu năng (tránh gọi DB liên tục) và bảo mật (chống Brute-force nhưng không làm chết UX) là cực kỳ quan trọng. Cơ chế Ngắt mạch sớm (Fast-Fail) là một kỹ thuật tuyệt vời.
```

Gợi ý:

- Kiến thức kỹ thuật đã hiểu rõ hơn.
- Kỹ năng lập trình đã cải thiện.
- Cách thiết kế hệ thống.
- Cách kiểm thử.
- Cách phân tích yêu cầu.
- Cách làm việc nhóm.
- Cách giải quyết lỗi.
- Cách trình bày sản phẩm.
- Cách đọc và hiểu tài liệu kỹ thuật.

---

## 12. Bài học về sử dụng AI có trách nhiệm

Sau bài tập/project này, em/nhóm học được gì về việc sử dụng AI một cách minh bạch, có trách nhiệm?

```text
Sử dụng AI có trách nhiệm có nghĩa là luôn trung thực khai báo nguồn gốc đoạn code và giải pháp do AI tư vấn. Không bao giờ copy nguyên bản không qua kiểm chứng, luôn tìm hiểu và nắm chắc cơ chế hoạt động của code để tự bảo vệ trước hội đồng bảo vệ dự án.
```

Gợi ý:

- Không nên copy nguyên kết quả AI.
- Cần kiểm tra lại mọi kết quả AI.
- Cần hiểu nội dung trước khi nộp.
- Cần ghi nhận việc sử dụng AI.
- Cần biết AI có thể sai.
- Cần tự chịu trách nhiệm với sản phẩm cuối cùng.
- Cần dùng AI như công cụ hỗ trợ học tập, không thay thế hoàn toàn việc học.

---

## 13. Điều em/nhóm sẽ không làm khi sử dụng AI

Đánh dấu các cam kết phù hợp.

- [x] Không dùng AI để làm toàn bộ bài mà không hiểu nội dung.
- [x] Không nộp nguyên văn kết quả AI nếu chưa kiểm tra.
- [x] Không che giấu việc sử dụng AI trong các phần quan trọng.
- [x] Không dùng AI để tạo nội dung sai lệch hoặc gian lận.
- [x] Không dùng AI thay thế hoàn toàn quá trình học.
- [x] Không bỏ qua yêu cầu, rubric hoặc hướng dẫn của giảng viên.

### Giải thích thêm nếu có

```text
Tuyệt đối tuân thủ cam kết học thuật và liêm chính trong học tập. AI là trợ lý đồng hành đắc lực, nhưng con người mới là kỹ sư kiến tạo sản phẩm.
```

---

## 14. Kế hoạch cải thiện lần sau

Lần sau em/nhóm sẽ sử dụng AI tốt hơn bằng cách nào?

```text
- Viết prompt có cấu trúc và cung cấp đầy đủ bối cảnh (context) về Business rules của dự án.
- Tự chuẩn bị tài liệu thiết kế và sơ đồ DB trước khi nhờ AI hiện thực hóa code.
- Ghi chép nhật ký sử dụng AI thường xuyên ngay sau mỗi mốc tính năng thay vì để dồn cuối kỳ.
```

Gợi ý:

- Viết prompt rõ hơn.
- Cung cấp nhiều ngữ cảnh hơn cho AI.
- Không hỏi AI làm toàn bộ bài.
- Tập trung hỏi AI giải thích, gợi ý, review.
- Tự kiểm tra kỹ hơn.
- Ghi log thường xuyên hơn.
- Liên kết log với commit/screenshot rõ hơn.
- Thảo luận với nhóm trước khi áp dụng kết quả AI.
- Đối chiếu kết quả AI với tài liệu môn học.

---

## 15. Tự đánh giá mức độ hoàn thành

Sinh viên/nhóm tự đánh giá theo thang 1-5.

| Tiêu chí | Điểm tự đánh giá 1-5 | Ghi chú |
|---|:---:|---|
| Ghi nhận việc dùng AI trung thực | 5 | Ghi chép chi tiết 15 lần dùng kèm mã nguồn minh chứng. |
| Prompt có mục tiêu rõ ràng | 5 | Prompt cấu trúc tốt, có ngữ cảnh và bối cảnh rõ ràng. |
| Kiểm chứng kết quả AI | 5 | Có viết Unit Test và chạy thử E2E trực tiếp dưới DB. |
| Tự chỉnh sửa/cải tiến | 5 | Nhiều cải tiến bảo mật và fix bug phức tạp tự làm. |
| Hiểu nội dung đã nộp | 5 | Giải thích trôi chảy toàn bộ luồng nghiệp vụ code. |
| Reflection có chiều sâu | 5 | Đúc rút nhiều bài học thực tế từ SDLC và concurrency. |
| Sử dụng AI có trách nhiệm | 5 | Tuyệt đối tuân thủ cam kết liêm chính học thuật. |

---

## 16. Câu hỏi tự vấn cuối bài

Trả lời ngắn gọn các câu hỏi sau.

### 16.1. Nếu giảng viên hỏi về phần AI đã hỗ trợ, em/nhóm có giải thích lại được không?

```text
Chắc chắn giải thích được 100%. Em đã trực tiếp nghiên cứu, chỉnh sửa và gỡ lỗi mọi đoạn code do AI hỗ trợ nên nắm cực kỳ vững kiến trúc và dòng chảy của code.
```

### 16.2. Nếu không có AI, em/nhóm có thể tự làm lại phần quan trọng nhất không?

```text
Hoàn toàn có thể. Việc tự giải quyết các bug Concurrency Distributed Lock và lỗi PostgreSQL Custom Enum chứng tỏ em hoàn toàn làm chủ được các phần cốt lõi của tính năng.
```

### 16.3. Phần nào trong bài thể hiện rõ nhất năng lực thật sự của em/nhóm?

```text
Đó là cơ chế bảo mật và tối ưu: thiết kế Dynamic Appeal, thu hồi session chủ động (Active Session Revocation) trên Redis, gửi WebSocket realtime, và xử lý chunked upload Cloudinary.
```

### 16.4. Em/nhóm muốn cải thiện kỹ năng nào sau bài này?

```text
Em muốn cải thiện sâu hơn về kỹ năng thiết kế hệ thống chịu tải cao (High Concurrency System) và kỹ năng quản lý rủi ro bảo mật ứng dụng (Application Security).
```

---

## 17. Cam kết Reflection

Em/nhóm cam kết rằng nội dung reflection này phản ánh trung thực quá trình sử dụng AI và quá trình học tập trong bài tập/project.

Sinh viên/nhóm hiểu rằng:

- AI là công cụ hỗ trợ học tập, không thay thế hoàn toàn năng lực cá nhân.
- Mọi kết quả AI gợi ý cần được kiểm tra trước khi sử dụng.
- Sinh viên/nhóm chịu trách nhiệm với sản phẩm cuối cùng.
- Sinh viên/nhóm cần giải thích được các phần đã nộp.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Nguyễn Thành Đạt | 30/06/2026 |
