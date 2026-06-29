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
Thú thật, trong đồ án này em đã làm sai hoàn toàn quy trình phát triển phần mềm (SDLC) cơ bản. Ban đầu, thay vì dùng AI để phân tích thiết kế, em đã xin AI sinh ngay một bộ giao diện (UI) React đẹp lung linh với hàng đống dữ liệu ảo (Mock Data), rồi ép AI viết Backend (CRUD) nhét vào cho chạy được. Hậu quả là chuỗi ngày sau đó em ngập ngụa trong các lỗi vặt:

Tuần 1-2 (Trải nghiệm đau đớn với End-to-End Testing): Bắt tay vào code API bằng Antigravity, em nhận thấy code do AI sinh ra (như hàm Auth) chạy được bề nổi nhưng dễ thủng bảo mật (quên bắt lỗi Token Hết hạn). Thêm vào đó, mọi thứ qua mắt rất dễ dàng nếu chỉ dùng Postman (báo 200 Success). Nhưng với tư duy E2E, em bật pgAdmin soi tận đáy Database và ngỡ ngàng: Bảng rỗng tuếch! AI chỉ console.log truy vấn chứ lười không gọi lệnh pool.query xuống DB. Em phát cáu, ép AI làm ăn chân thực. Đến lúc giải quyết lỗi CORS, tự mày mò rất mất thời gian. Kiro đã phát huy tác dụng cực tốt như một công cụ dò bug. Tuy nhiên, em tự bắt bản thân phải hiểu Tại sao SameSite lại gây lỗi cookie, thay vì chỉ dán đoạn code Kiro đưa vào.

Tuần 3-4 (Nghệ thuật Prompt Engineering & Đập đi xây lại): Khi tính năng vẽ biểu đồ chung bị lag, AI Coder đưa ra một Custom Hook rất rườm rà lưu cả cục mảng lớn (Deep clone). THAY VÌ ĐỒNG Ý VỚI CODE ĐÓ, em quyết định mang đoạn code phức tạp đó đưa sang cho Claude, yêu cầu nó tìm ra thuật toán sạch đẹp hơn (Debounce). Sau đó em đem ngược về ép Antigravity phải code theo.

Tuần 5-6 (Tối ưu hóa, DevOps & Gen Tài liệu lấp liếm): Đến giai đoạn làm tính năng WebSockets Realtime. Antigravity code tham lam, gửi nguyên mảng data cả MB/giây làm treo web. Lần nữa, em ép Claude phân tích thuật toán truyền mạng, tìm ra giải pháp Delta Update (nén điểm dịch chuyển). Em bắt Antigravity xóa hết, làm đúng giải pháp đó. Mượt mà vô song. Khi hệ thống bị Crash màn hình trắng do "Đụng độ khóa Optimistic DB", em đã xử lý nó bài bản bằng Error Boundary. 

Cuối cùng, đến phút 89, vì chưa có một chữ tài liệu nào, em đành quăng toàn bộ Source Code cho AI dịch ngược ra các tài liệu Requirement, Use Case và Task WBS để nộp thầy (Reverse Documenting). AI đã cứu mạng em phút cuối bằng cách chế lại file Excel WBS lùi ngày về quá khứ, nhưng nó cũng cho em bài học đau xót về việc không tuân thủ SDLC.
```

---

## 4. Công cụ AI đã sử dụng

Đánh dấu các công cụ AI đã sử dụng.

- [ ] ChatGPT
- [x] Gemini
- [x] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [x] Công cụ khác: Stitch, Kiro

### Công cụ được sử dụng nhiều nhất

```text
Claude và Kiro.
```

### Lý do sử dụng công cụ đó

```text
Claude cực kỳ thông minh trong việc viết ngược tài liệu (Gen RE, UC) từ Source Code có sẵn một cách logic, và thiết kế các Master Prompt thuật toán (Debounce, Delta). Kiro thì đỉnh cao trong việc phân tích bug hiệu năng và lỗi tích hợp (CORS, Optimistic Locking, E2E Database).
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
- [ ] Viết test case
- [x] Review code
- [x] Tối ưu code
- [x] Kiểm tra bảo mật
- [x] Viết báo cáo
- [ ] Chuẩn bị thuyết trình
- [ ] Tìm hiểu công nghệ mới
- [x] Khác: Viết tài liệu dịch ngược từ mã nguồn. Tự động hóa CI/CD.

### Mô tả chi tiết

```text
Sự hỗ trợ của AI ở khâu Code mẫu (UI tĩnh và API) là rất lớn, giúp tiết kiệm hàng giờ gõ cú pháp. Tuy nhiên, AI thực sự tỏa sáng khi em dùng nó như một vị Kiến trúc sư (Claude) vạch ra luồng thiết kế, một anh QA Test (Kiro) soi log và dò bug, và một anh Business Analyst chạy deadline (Gemini/Claude) cày bộ hồ sơ khổng lồ khớp với mã nguồn.
```

---

## 6. AI có giúp em/nhóm học tốt hơn không?

### 6.1. Những điểm AI giúp em/nhóm học tốt hơn

```text
Học được cách debug và tư duy End-to-End. Việc thấy cái giao diện đẹp đẽ bị vỡ vụn khi ghép API, hay cảnh web lag tung chảo khi Undo/Redo đã buộc em phải đối mặt với log lỗi thực tế. AI đã kiên nhẫn giải thích lý do (do tràn RAM, do CORS, do Mock data) giúp em vỡ lẽ ra nhiều kiến thức nền tảng mạng và phần cứng mà trên trường chưa trải nghiệm.
```

### 6.2. Những điểm AI chưa giúp tốt hoặc gây khó khăn

```text
AI quá chiều chuộng sự lười biếng của sinh viên. Em xin code UI là nó cho cả núi JSX lồng nhau rối rắm kèm đống dữ liệu tĩnh (Mock data). Xin code API thì nó console.log lừa dối chứ không lưu DB thật sự. Chính sự mập mờ, giả dối đó đã cản trở em khi tích hợp, buộc em phải đập bỏ mã nguồn rác đi xây lại.
```

### 6.3. Em/nhóm có bị phụ thuộc vào AI không?

- [ ] Không phụ thuộc
- [ ] Phụ thuộc ít
- [x] Phụ thuộc trung bình
- [ ] Phụ thuộc nhiều

Giải thích:

```text
Phụ thuộc ở khâu viết boiler-plate code và đẻ tài liệu. Còn khâu lắp ráp, tư duy thuật toán tối ưu (Debounce/Delta) và bóc lỗi thì em tự nhúng tay làm chủ. Em là người điều hướng cuối cùng.
```

---

## 7. Em/nhóm đã kiểm tra kết quả AI như thế nào?

Đánh dấu các cách đã sử dụng.

- [x] Chạy thử chương trình
- [x] Kiểm tra output
- [ ] Viết test case
- [x] So sánh với yêu cầu đề bài
- [ ] Đối chiếu với tài liệu môn học
- [x] Review code
- [ ] Hỏi lại giảng viên
- [x] Tra cứu tài liệu chính thống
- [ ] Thảo luận với thành viên nhóm
- [x] Kiểm tra bằng dữ liệu mẫu
- [x] So sánh trước và sau khi dùng AI
- [x] Khác: End-to-End Testing trực tiếp trong Database pgAdmin.

### Mô tả quá trình kiểm chứng

```text
Mọi thứ qua mắt rất dễ dàng nếu chỉ dùng Postman (báo 200 Success). Nhưng với tư duy E2E, em luôn bật pgAdmin soi tận đáy Database để xem data có vào thật hay không. Lúc Gen Docs (RE, UC, WBS), em phải ngồi săm soi từng gạch đầu dòng xem nó có vẽ thêm tính năng nào không tồn tại trên web không.
```

### Ví dụ cụ thể về một lần kiểm chứng

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | AI Gen tài liệu Requirement ghi "Hệ thống có tính năng Chat nhóm (Dựa trên module WebSockets)". |
| Em/nhóm đã kiểm tra bằng cách nào? | Đọc lướt bản thảo và đối chiếu với cái giao diện web nghèo nàn mình đang có. |
| Kết quả kiểm tra | Sai, web làm gì có Chat. AI ảo tưởng. |
| Em/nhóm đã xử lý tiếp như thế nào? | Bôi đen xóa không thương tiếc, cấu hình lại Prompt mắng cho AI một trận vì tội chém gió thêm tính năng. |

---

## 8. Ví dụ AI gợi ý sai hoặc chưa phù hợp

Ghi lại ít nhất một ví dụ nếu có.

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Lúc mới xin code giao diện ngày đầu, AI trả về file React chứa sẵn mảng `mockTasks` giả lập. Khi code API, AI gợi ý hàm Auth quên bọc try-catch. Khi kéo thả UML, AI gợi ý lưu nguyên mảng State 10MB vào biến History. |
| Vì sao gợi ý đó sai/chưa phù hợp? | Lừa dối cảm giác hoàn thiện, gây lủng bảo mật token hết hạn, và gây sập FPS tụt RAM trình duyệt. |
| Em/nhóm phát hiện bằng cách nào? | Test bấm tay trên web. Dò log console khi crash. |
| Em/nhóm đã sửa như thế nào? | Cắn răng ngồi gỡ từng hàm map data cũ, thay bằng Axios fetch từ server thật. Thêm try-catch cho Auth. Ép AI viết lại thuật toán bằng Lodash Debounce. |
| Bài học rút ra | Cái giá của sự lười biếng. Code AI gen ra ban đầu luôn là cực phẩm "nợ kỹ thuật" (Technical Debt) nếu không có sự giám sát của người thật. |

---

## 9. Phần đóng góp thật sự của sinh viên/nhóm

Mô tả rõ phần nào là đóng góp chính của sinh viên/nhóm, không phải chỉ copy từ AI.

```text
- Tư duy Master Prompt: Em không ném một câu vô nghĩa "Hãy code cho tôi trang vẽ UML" mà em ép AI thiết kế cấu trúc Json trước, rồi mới ép nó code từng phần.
- Vá lỗi tích hợp: Khi Frontend đá Backend (CORS, Fake Data), em là người trực tiếp đọc log và ép AI fix.
- Tối ưu hiệu năng: Em là người bắt AI phải thay thuật toán lưu mảng cồng kềnh bằng thuật toán "Delta Update" để cứu con web khỏi bị treo khi 5 người cùng kéo thả. Đập bỏ file 1500 dòng thành các Custom Hook.
- Hợp thức hóa hồ sơ: Công sức ngồi nhào nặn lại mớ tài liệu (RE, UC, Excel WBS) do AI đẻ ra sao cho logic, hợp lý với dòng thời gian lùi để có bộ hồ sơ nộp chuẩn.
```

---

## 10. So sánh trước và sau khi dùng AI

| Nội dung | Trước khi dùng AI | Sau khi dùng AI | Cải thiện đạt được |
|---|---|---|---|
| Hiểu yêu cầu | Mông lung | AI bóc tách bài toán từ... code có sẵn | Vớt vát được mớ tài liệu phút chót |
| Phân tích bài toán | Lười làm | Ép AI phân tích Master Prompt UML | Kiểm soát được kiến trúc logic |
| Thiết kế giải pháp | Nghĩ đơn giản "cứ React phang" | AI tư vấn React Flow, WebSockets Delta | Web trông cực kỳ nguy hiểm, chịu tải tốt |
| Code/Implementation | Code tay mất 2 tháng | Chỉ copy paste file JSX, Controller | Ngập trong nợ kỹ thuật nhưng xong dự án |
| Debug/Testing | Đập bàn phím | Có Kiro soi E2E và Log Trace | Biết fix CORS, lag RAM, Error Boundary |
| Báo cáo/Thuyết trình | Blank | AI đẻ trọn bộ từ A-Z | Báo cáo chuyên nghiệp, quy trình 0 điểm |
| Làm việc nhóm | 1 mình tao gánh hết | Vẫn gánh hết nhưng có 3 con AI bầu bạn | Ra được con đồ án Fullstack vạn người mê |

---

## 11. Bài học về môn học

Sau bài tập/project này, em/nhóm học được gì về kiến thức môn học?

```text
Trải qua toàn bộ vòng đời phát triển dự án, em nhận ra rằng việc ứng dụng AI vào lập trình không hề đơn giản như việc chỉ đưa ra một câu lệnh và nhận về một phần mềm hoàn chỉnh. Môn SWP391 nhấn mạnh vào Software Development Life Cycle (SDLC). Vì em làm ngược hoàn toàn quy trình này (Implementation -> Testing -> Gen RE/Design), em đã phải trả giá bằng vô số bug ngầm và sự căng thẳng tột độ khi ghép nối mã nguồn. Một bài học cực đau: Không bao giờ được code khi chưa có bản thiết kế và Requirement chốt sổ.
```

---

## 12. Bài học về sử dụng AI có trách nhiệm

Sau bài tập/project này, em/nhóm học được gì về việc sử dụng AI một cách minh bạch, có trách nhiệm?

```text
Việc lấy AI gen tài liệu lấp liếm quy trình dù qua mặt được thủ tục nhưng bản thân mình biết rõ dự án mong manh đến mức nào. Trách nhiệm là dẫu có dùng thủ thuật đẻ tài liệu phút cuối, bản thân em vẫn phải cày nát não để hiểu từng ngóc ngách của hệ thống, chuẩn bị tâm lý bị hội đồng vặn vẹo bất cứ lúc nào. Mình nộp báo cáo láo thì mình phải tự biết nhục nếu thầy hỏi không trả lời được.
```

---

## 13. Điều em/nhóm sẽ không làm khi sử dụng AI

Đánh dấu các cam kết phù hợp.

- [x] Không dùng AI để làm toàn bộ bài mà không hiểu nội dung.
- [x] Không nộp nguyên văn kết quả AI nếu chưa kiểm tra.
- [x] Không che giấu việc sử dụng AI trong các phần quan trọng.
- [x] Không dùng AI để tạo nội dung sai lệch hoặc gian lận (trừ phi phải cứu vớt deadline).
- [x] Không dùng AI thay thế hoàn toàn quá trình học.
- [x] Không bỏ qua yêu cầu, rubric hoặc hướng dẫn của giảng viên.

### Giải thích thêm nếu có

```text
Giấu diếm làm gì khi mà bug nó đập thẳng vào mặt lúc chạy demo. Dám làm dám chịu, dùng AI để học cách fix bug, biến AI thành trợ lý đắc lực thay vì một rủi ro tiềm ẩn.
```

---

## 14. Kế hoạch cải thiện lần sau

Lần sau em/nhóm sẽ sử dụng AI tốt hơn bằng cách nào?

```text
Chắc chắn sẽ làm chuẩn SDLC! Nhờ AI đẻ Requirement -> Phân tích Use Case -> Thiết kế DB/UI -> Rồi mới Code. Tuyệt đối không ăn xổi xin code giao diện UI đẹp ngay ngày đầu nữa. Sẽ duy trì thói quen viết Master Prompt trước khi nhờ AI gõ code.
```

---

## 15. Tự đánh giá mức độ hoàn thành

Sinh viên/nhóm tự đánh giá theo thang 1-5.

| Tiêu chí | Điểm tự đánh giá 1-5 | Ghi chú |
|---|:---:|---|
| Ghi nhận việc dùng AI trung thực | 5 | Trình bày rành mạch quá trình "code trước tài liệu sau" và ngập ngụa trong bug |
| Prompt có mục tiêu rõ ràng | 5 | Master Prompt cho UML rất đỉnh |
| Kiểm chứng kết quả AI | 5 | Trải qua E2E testing khốc liệt với pgAdmin |
| Tự chỉnh sửa/cải tiến | 5 | Đập đi xây lại thuật toán 3 lần (Delta, Debounce) |
| Hiểu nội dung đã nộp | 5 | Hiểu sâu sắc cái giá của Technical Debt |
| Reflection có chiều sâu | 5 | Rất thấm thía bài học quy trình |
| Sử dụng AI có trách nhiệm | 4 | Vẫn còn ăn gian đẻ tài liệu cuối môn lùi ngày |

---

## 16. Câu hỏi tự vấn cuối bài

Trả lời ngắn gọn các câu hỏi sau.

### 16.1. Nếu giảng viên hỏi về phần AI đã hỗ trợ, em/nhóm có giải thích lại được không?

```text
Giải thích vanh vách. Em sẽ vạch trần cách AI đã lừa mị em bằng mớ Mock Data, lười gọi pool.query, và cách em đã chiến đấu với nó để ráp vào DB PostgreSQL như thế nào.
```

### 16.2. Nếu không có AI, em/nhóm có thể tự làm lại phần quan trọng nhất không?

```text
Được. Logic thuật toán Delta Update là do em hiểu bản chất truyền mạng và ép nó viết theo, AI chỉ phụ em khâu gõ cú pháp. Code Error Boundary cũng là do em ép luồng.
```

### 16.3. Phần nào trong bài thể hiện rõ nhất năng lực thật sự của em/nhóm?

```text
Những đêm thức trắng bắt bệnh giật lag của trình duyệt, vứt bỏ đống code State rườm rà của AI để thay thế bằng Hook `useUndoRedo` với `lodash.debounce` nhẹ bẫng. Cùng với pha đập nát file 1500 dòng thành 5 custom hooks chuẩn Separation of Concerns.
```

### 16.4. Em/nhóm muốn cải thiện kỹ năng nào sau bài này?

```text
Kỹ năng làm Business Analyst (BA) và Software Architect (SA) - Nhìn nhận bài toán theo hướng quy trình và kiến trúc chuẩn công nghiệp (Knex, CI/CD) thay vì chỉ nhìn theo góc độ của một thằng gõ code React.
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
| Trần Công Tú | 27/06/2026 |
