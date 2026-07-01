# AI Learning Reflection

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | Software Engineering Practice |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | Summer 2026 |
| Tên bài tập / Project | DevTrack AI — AI-Powered Test Management Platform |
| Tên sinh viên / Nhóm | Phạm Duy Hưng — Group 04 |
| MSSV / Danh sách MSSV | DE190330 |
| Giảng viên hướng dẫn | |
| Ngày hoàn thành reflection | 30/06/2026 |

---

## 2. Mục đích Reflection

File này thể hiện quá trình tự đánh giá của em về việc sử dụng AI trong suốt project
DevTrack AI — từ giai đoạn phân tích yêu cầu (SRS), thiết kế kiến trúc bất đồng bộ
(Kafka/Outbox/WebSocket), xây dựng Local Agent, module AI Gen TestCase, module API Testing,
cho đến việc redesign UI và lập kế hoạch scale hạ tầng.

---

## 3. Tóm tắt quá trình sử dụng AI

```text
Em dùng AI (Antigravity/Kiro) xuyên suốt cả 3 giai đoạn requirement, design và implementation,
không chỉ ở coding. Giai đoạn đầu, AI giúp dựng khung SRS và Screen Specification nhất quán
cho hơn 20 màn hình. Giai đoạn thiết kế là nơi AI đóng góp nhiều nhất: state machine cho
TestRun/TestExecution, Outbox Pattern, kiến trúc Local Agent, kiến trúc module API Testing.
Giai đoạn implementation và debug, AI giúp sinh code khung và chẩn đoán nhanh các lỗi hệ phân
tán (Kafka partitioning, Hibernate 7 enum binding), nhưng phần xác nhận thực nghiệm và sửa lỗi
chi tiết (thiếu projectId, sai field response, tham số bị ghi đè, circular dependency) đều do
em tự làm sau khi review kỹ từng đề xuất.

Antigravity (Kiro) là công cụ dùng nhiều nhất vì có khả năng đọc hiểu nhiều file liên quan
trong cùng 1 phiên (backend Spring Boot, Node.js Playwright Service, React frontend), phù hợp
với đặc thù project đa service của DevTrack AI. Có một số đề xuất của AI không được dùng —
ví dụ giải pháp "fire-and-forget" thuần cho vấn đề song song hoá TestRun bị từ chối vì rủi ro
quá tải worker nếu không có semaphore đi kèm.
```

---

## 4. Công cụ AI đã sử dụng

- [ ] ChatGPT
- [ ] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [ ] Công cụ khác: ....................................

### Công cụ được sử dụng nhiều nhất

```text
Antigravity (Kiro)
```

### Lý do sử dụng công cụ đó

```text
Đây là công cụ AI agentic có khả năng đọc hiểu codebase lớn, giúp phân tích toàn diện nhiều
file liên kết với nhau (Spring Boot Backend <-> Node.js Playwright Service/Agent <-> React
Frontend) trong cùng một phiên làm việc, thay vì chỉ sinh code rời rạc từng file một như các
công cụ chat thông thường.
```

---

## 5. AI đã hỗ trợ em/nhóm ở điểm nào?

- [x] Hiểu yêu cầu đề bài
- [x] Phân tích bài toán
- [x] Tìm ý tưởng giải pháp
- [x] Thiết kế database
- [x] Thiết kế giao diện
- [x] Thiết kế kiến trúc hệ thống
- [x] Viết code mẫu
- [x] Debug lỗi
- [ ] Viết test case (tự động)
- [x] Review code
- [x] Tối ưu code
- [ ] Kiểm tra bảo mật
- [x] Viết báo cáo
- [ ] Chuẩn bị thuyết trình
- [ ] Tìm hiểu công nghệ mới
- [ ] Khác: ....................................

### Mô tả chi tiết

```text
Điểm hỗ trợ rõ nhất là thiết kế kiến trúc hệ thống: AI giúp em dựng nhanh state machine đầy đủ
cho TestRun/TestExecution, kiến trúc Local Agent (AgentTask polling pattern), và kiến trúc
module API Testing dựa trên Spring Event để né circular dependency. Ở mảng debug, AI hữu ích
để đưa ra giả thuyết nhanh cho các lỗi phức tạp liên quan Kafka partitioning và Hibernate 7,
giúp rút ngắn thời gian tìm nguyên nhân so với dò từng dòng log một mình. Ở mảng UI, AI hỗ trợ
hệ thống hoá bảng token màu khi đổi theme, giúp đảm bảo tính nhất quán giữa các file CSS/
component.
```

---

## 6. AI có giúp em/nhóm học tốt hơn không?

### 6.1. Những điểm AI giúp em/nhóm học tốt hơn

```text
- Hiểu sâu hơn về Outbox Pattern và lý do cần tách biệt DB write khỏi Kafka publish, thay vì
  chỉ biết khái niệm chung chung.
- Biết cách phân tích một bug hệ phân tán theo nhiều lớp nguyên nhân (ví dụ vấn đề song song
  hoá TestRun có tới 3 nguyên nhân cộng hưởng), thay vì chỉ nhìn vào 1 lỗi bề mặt.
- Học được pattern dùng ApplicationEventPublisher (Spring Event) để giải quyết circular
  dependency — điều em chưa từng áp dụng trước project này.
- Có thêm ví dụ minh hoạ cụ thể (Kubernetes Deployment + KEDA ScaledObject) cho khái niệm scale
  horizontal vốn trước đây chỉ biết trên lý thuyết.
```

### 6.2. Những điểm AI chưa giúp tốt hoặc gây khó khăn

```text
- AI đôi khi đưa ra thiết kế "sạch trên giấy" nhưng bỏ sót chi tiết thực thi quan trọng — ví dụ
  quên set projectId khi map JSON sang entity, hay đọc nhầm tên field (evidenceUrls thay vì
  screenshots) giữa 2 luồng code tương tự nhau.
- Ở lần đầu thiết kế module API Testing, AI đề xuất kiến trúc có nguy cơ circular dependency
  thật nếu không được yêu cầu tường minh phải né vấn đề đó.
- Với các lỗi cần thực nghiệm mới xác nhận được (như vấn đề song song hoá Kafka), AI chỉ đưa ra
  giả thuyết hợp lý, không thể tự xác nhận đúng/sai — vẫn cần em thêm log và chạy lại thực tế.
```

### 6.3. Em/nhóm có bị phụ thuộc vào AI không?

- [ ] Không phụ thuộc
- [x] Phụ thuộc ít
- [ ] Phụ thuộc trung bình
- [ ] Phụ thuộc nhiều

Giải thích:

```text
AI được dùng nhiều ở giai đoạn lên ý tưởng kiến trúc và sinh code khung ban đầu, nhưng mọi
quyết định kỹ thuật cuối cùng (chọn giải pháp nào trong nhiều phương án, việc có chấp nhận
trade-off hay không, cách sửa từng bug cụ thể) đều do em tự cân nhắc dựa trên constraint thực
tế của project (quy mô lớp học, hạ tầng Kafka single-broker, stack không có WebFlux). Việc
liên tục phải đối chiếu đề xuất của AI với source code thật giúp em không rơi vào trạng thái
copy-paste mù quáng.
```

---

## 7. Em/nhóm đã kiểm tra kết quả AI như thế nào?

- [x] Chạy thử chương trình
- [x] Kiểm tra output
- [ ] Viết test case
- [x] So sánh với yêu cầu đề bài
- [ ] Đối chiếu với tài liệu môn học
- [x] Review code
- [ ] Hỏi lại giảng viên
- [ ] Tra cứu tài liệu chính thống
- [ ] Thảo luận với thành viên nhóm
- [x] Kiểm tra bằng dữ liệu mẫu
- [x] So sánh trước và sau khi dùng AI
- [x] Khác: kiểm tra trực tiếp trong PostgreSQL (psql) trước khi áp dụng fix migration

### Mô tả quá trình kiểm chứng

```text
Với các đề xuất liên quan database, em luôn kiểm tra type/constraint thực tế trong psql trước
khi áp dụng fix mà AI gợi ý, vì AI chỉ chẩn đoán dựa trên đoạn entity code được cung cấp, không
thấy được trạng thái DB thật. Với các đề xuất liên quan hệ phân tán (Kafka), em thêm log tạm
thời (partition-id) để tái hiện lỗi và xác nhận đúng nguyên nhân trước khi tin và áp dụng giải
pháp. Với code frontend/backend sinh ra, em chạy thử end-to-end (Run TestCase qua cả luồng
Cloud và Local Agent) để đảm bảo hành vi đúng như kỳ vọng, không chỉ đọc code là xong.
```

### Ví dụ cụ thể về một lần kiểm chứng

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Dùng testRunId làm Kafka key để tránh 2 TestRun rơi cùng partition, giúp chạy song song |
| Em/nhóm đã kiểm tra bằng cách nào? | Thêm log ghi partition-id khi consume message, chạy 2 test case cùng lúc trước và sau khi áp dụng key, so sánh thời gian hoàn thành |
| Kết quả kiểm tra | Đúng — sau khi thêm key, 2 TestRun được xử lý song song trên 2 partition khác nhau |
| Em/nhóm đã xử lý tiếp như thế nào? | Kết hợp thêm semaphore giới hạn concurrency trong worker để tránh trường hợp nhiều TestRun cùng lúc vẫn có thể rơi trùng partition do hash trùng |

---

## 8. Ví dụ AI gợi ý sai hoặc chưa phù hợp

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Thiết kế ban đầu cho ApiTestExecutorService gọi trực tiếp AgentTaskService để xử lý delegate localhost |
| Vì sao gợi ý đó sai/chưa phù hợp? | Khi AgentTaskService cần gọi ngược lại ApiTestExecutorService để đánh giá kết quả trả về từ Local Agent, thiết kế này tạo circular dependency thật giữa 2 service |
| Em/nhóm phát hiện bằng cách nào? | Tự vẽ lại call graph giữa 2 service trước khi bắt đầu code, phát hiện chiều gọi ngược sẽ xảy ra ở bước evaluate assertion |
| Em/nhóm đã sửa như thế nào? | Yêu cầu AI thiết kế lại theo hướng dùng ApplicationEventPublisher (Spring Event) để decouple hoàn toàn 2 service, không service nào gọi trực tiếp service kia |
| Bài học rút ra | Với thiết kế nhiều service tương tác 2 chiều, cần chủ động vẽ call graph trước khi chấp nhận kiến trúc AI đề xuất, thay vì chỉ đọc mô tả bằng lời thấy "hợp lý" là code luôn |

---

## 9. Phần đóng góp thật sự của sinh viên/nhóm

```text
- Tư duy phản biện và Review Code: Không copy-paste mù quáng bất kỳ đề xuất kiến trúc nào. Ví
  dụ: phát hiện AI quên set projectId trong approveTestCaseGeneration(), phát hiện field
  evidenceUrls/screenshots bị đọc nhầm ở 2 luồng code khác nhau, phát hiện tham số envOverrides
  bị ghi đè trong executor.js.
- Quản lý kiến trúc và constraint thực tế: Tự quyết định lưu agent_token trực tiếp trên Project
  entity thay vì tạo Entity riêng; tự vẽ lại call graph để phát hiện circular dependency giữa
  ApiTestExecutorService và AgentTaskService trước khi code.
- Xử lý edge-case bằng thực nghiệm: Tự thêm log partition-id để xác nhận nguyên nhân gốc của
  lỗi song song hoá TestRun trước khi áp dụng fix, thay vì tin tưởng tuyệt đối vào phân tích lý
  thuyết của AI.
- Cân bằng trade-off dựa trên quy mô thực tế của project: Từ chối giải pháp "fire-and-forget"
  thuần vì rủi ro quá tải, chọn phương án kết hợp Kafka key + semaphore sau khi tự đánh giá
  bảng so sánh effort/risk/hiệu quả.
- Sửa cấu hình hệ thống mà AI không tự phát hiện: Tự phát hiện và sửa block `app:` bị duplicate
  trong application.yaml khi AI tự động merge file, khiến WebSocket relay URL bị ghi đè sai.
```

---

## 10. So sánh trước và sau khi dùng AI

| Nội dung | Trước khi dùng AI | Sau khi dùng AI | Cải thiện đạt được |
|---|---|---|---|
| Hiểu yêu cầu | Chỉ có mô tả đề bài dạng tổng quát | Có Screen Inventory + Screen Specification chi tiết theo khung mẫu thống nhất | Đặc tả rõ ràng hơn, dễ đối chiếu implementation |
| Phân tích bài toán | Biết luồng chạy test bị block nhưng chưa rõ giải pháp | Có state machine + Outbox Pattern + event taxonomy đầy đủ | Có nền tảng kiến trúc rõ ràng trước khi code |
| Thiết kế giải pháp | Ý tưởng rời rạc, chưa có mô hình xử lý localhost | Có kiến trúc Local Agent hoàn chỉnh, tái sử dụng được cho cả UI Testing và API Testing | Giảm effort thiết kế lặp lại giữa 2 module |
| Code/Implementation | Viết từng dòng thủ công, chậm với code khung lặp lại | Có skeleton nhanh, tập trung thời gian vào business logic và bug thật | Tăng tốc độ, nhưng luôn phải review kỹ để bắt lỗi ẩn |
| Debug/Testing | Dò lỗi hệ phân tán (Kafka) mất nhiều thời gian thử-sai | Có giả thuyết nhanh từ AI, rút ngắn thời gian khoanh vùng nguyên nhân | Debug hiệu quả hơn nhưng vẫn cần xác nhận thực nghiệm |
| Báo cáo/Thuyết trình | Chưa có tài liệu tổng hợp AI usage | Có 4 file minh bạch AI đầy đủ, đối chiếu chéo được với nhau | Minh bạch và có thể giải trình từng phần đã dùng AI |
| Làm việc nhóm | Chưa áp dụng | Chưa áp dụng ở phạm vi phần việc cá nhân này | Không thay đổi đáng kể |

---

## 11. Bài học về môn học

```text
Qua project này, em hiểu rõ hơn về cách thiết kế hệ thống bất đồng bộ thực tế (không chỉ là lý
thuyết message queue), đặc biệt là các vấn đề dễ bị bỏ qua nếu chỉ học trên giấy: idempotency
khi Kafka redeliver message, tại sao cần Outbox Pattern thay vì publish trực tiếp trong
transaction, và tại sao partitioning ảnh hưởng trực tiếp đến khả năng chạy song song. Em cũng
hiểu sâu hơn về cách một hệ thống nhiều service (Backend, Playwright Service, Local Agent
CLI, Frontend) cần thống nhất một "hợp đồng" API/event rõ ràng trước khi từng phần được code
độc lập, nếu không sẽ rất khó tích hợp lại.
```

---

## 12. Bài học về sử dụng AI có trách nhiệm

```text
Bài học lớn nhất là: AI có thể tạo ra một thiết kế "nghe rất hợp lý" nhưng ẩn chứa lỗi cấu
trúc (circular dependency) hoặc lỗi chi tiết (field bị đọc sai, thiếu 1 dòng set property) mà
chỉ lộ ra khi thực sự chạy hoặc vẽ lại call graph. Vì vậy, em học được rằng trách nhiệm kiểm
chứng luôn thuộc về người lập trình viên, không phải AI. Một nguyên tắc em sẽ giữ lại sau
project này là: bất kỳ đề xuất kiến trúc nào ảnh hưởng đến nhiều service, em sẽ tự vẽ lại
sequence/call graph trước khi implement, thay vì tin vào mô tả bằng lời của AI.
```

---

## 13. Điều em/nhóm sẽ không làm khi sử dụng AI

- [x] Không dùng AI để làm toàn bộ bài mà không hiểu nội dung.
- [x] Không nộp nguyên văn kết quả AI nếu chưa kiểm tra.
- [x] Không che giấu việc sử dụng AI trong các phần quan trọng.
- [x] Không dùng AI để tạo nội dung sai lệch hoặc gian lận.
- [x] Không dùng AI thay thế hoàn toàn quá trình học.
- [x] Không bỏ qua yêu cầu, rubric hoặc hướng dẫn của giảng viên.

### Giải thích thêm nếu có

```text
Toàn bộ 12 lần sử dụng AI ghi trong AI_AUDIT_LOG.md đều có phần "sinh viên tự chỉnh sửa" cụ
thể, không có trường hợp nào chỉ copy nguyên kết quả AI mà không kiểm tra lại.
```

---

## 14. Kế hoạch cải thiện lần sau

```text
- Viết prompt kèm theo đoạn code hiện tại (thay vì chỉ mô tả bằng lời) để giảm rủi ro AI đề
  xuất giải pháp không tương thích với stack thực tế.
- Luôn yêu cầu AI liệt kê rủi ro/trade-off của từng phương án trước khi chọn, thay vì chỉ nhận
  1 giải pháp duy nhất và áp dụng ngay.
- Bổ sung automated test cho các phần đã dùng nhiều AI để hỗ trợ (Local Agent, API Testing),
  vì hiện tại việc kiểm chứng chủ yếu vẫn thủ công.
- Ghi log ngay trong lúc làm thay vì tổng hợp lại sau, để đảm bảo prompt và kết quả được ghi
  chính xác hơn thay vì phải nhớ lại.
```

---

## 15. Tự đánh giá mức độ hoàn thành

| Tiêu chí | Điểm tự đánh giá 1-5 | Ghi chú |
|---|:---:|---|
| Ghi nhận việc dùng AI trung thực | 5 | Không có lần sử dụng nào bị bỏ sót so với source code thực tế |
| Prompt có mục tiêu rõ ràng | 4 | Một số prompt đầu (giai đoạn requirement) còn khá ngắn |
| Kiểm chứng kết quả AI | 4 | Đã kiểm chứng kỹ các phần kiến trúc/backend, phần UI kiểm chứng chủ yếu bằng mắt |
| Tự chỉnh sửa/cải tiến | 5 | Mỗi entry trong AI_AUDIT_LOG đều có phần tự sửa cụ thể |
| Hiểu nội dung đã nộp | 5 | Có thể giải thích lại toàn bộ kiến trúc async, Local Agent, API Testing |
| Reflection có chiều sâu | 4 | |
| Sử dụng AI có trách nhiệm | 5 | |

---

## 16. Câu hỏi tự vấn cuối bài

### 16.1. Nếu giảng viên hỏi về phần AI đã hỗ trợ, em/nhóm có giải thích lại được không?

```text
Có. Em có thể giải thích rõ AI đã đề xuất gì ở từng module (state machine, Local Agent, API
Testing architecture) và phần nào em đã tự sửa lại (thiếu projectId, circular dependency, field
bị đọc sai), vì mỗi phần đều được ghi chi tiết và đối chiếu được giữa AI_AUDIT_LOG.md và
PROMPTS.md.
```

### 16.2. Nếu không có AI, em/nhóm có thể tự làm lại phần quan trọng nhất không?

```text
Có thể, nhưng sẽ mất nhiều thời gian hơn đáng kể để tự thiết kế state machine đầy đủ và tự phát
hiện các vấn đề Kafka partitioning từ đầu thay vì có AI hỗ trợ đưa ra giả thuyết ban đầu. Phần
xác nhận thực nghiệm và các quyết định trade-off cuối cùng thì hoàn toàn có thể tự làm, vì đó
vốn dĩ là phần em tự thực hiện trong suốt project.
```

### 16.3. Phần nào trong bài thể hiện rõ nhất năng lực thật sự của em/nhóm?

```text
Phần phát hiện và xử lý circular dependency tiềm ẩn trong thiết kế module API Testing, và phần
xác nhận thực nghiệm nguyên nhân gốc của lỗi song song hoá TestRun (thêm log, tái hiện lỗi, so
sánh trước/sau khi fix) — đây là những việc AI chỉ có thể gợi ý giả thuyết, còn việc xác nhận
đúng/sai và quyết định giải pháp cuối cùng hoàn toàn do năng lực đọc hệ thống và debug của em.
```

### 16.4. Em/nhóm muốn cải thiện kỹ năng nào sau bài này?

```text
Muốn cải thiện kỹ năng viết automated test cho hệ thống bất đồng bộ (hiện tại vẫn kiểm thử thủ
công là chính), và kỹ năng đọc/verify kiến trúc do AI đề xuất nhanh hơn thông qua việc vẽ call
graph/sequence diagram ngay trong lúc trao đổi với AI, thay vì làm việc đó sau khi đã nhận toàn
bộ đề xuất.
```

---

## 17. Cam kết Reflection

Em/nhóm cam kết rằng nội dung reflection này phản ánh trung thực quá trình sử dụng AI và quá
trình học tập trong bài tập/project.

Sinh viên/nhóm hiểu rằng:

- AI là công cụ hỗ trợ học tập, không thay thế hoàn toàn năng lực cá nhân.
- Mọi kết quả AI gợi ý cần được kiểm tra trước khi sử dụng.
- Sinh viên/nhóm chịu trách nhiệm với sản phẩm cuối cùng.
- Sinh viên/nhóm cần giải thích được các phần đã nộp.

| Đại diện sinh viên/nhóm | Ngày xác nhận |
|---|---|
| Phạm Duy Hưng | 30/06/2026 |
