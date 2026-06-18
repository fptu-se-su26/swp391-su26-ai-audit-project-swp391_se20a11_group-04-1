# AI Learning Reflection

## 1. Thông tin chung

| Thông tin | Nội dung |
|---|---|
| Môn học | SWP391 |
| Mã môn học | SWP391 |
| Lớp | SE20A11 |
| Học kỳ | SU26 |
| Tên bài tập / Project | DevTrack AI |
| Tên sinh viên / Nhóm | Nguyễn Minh Hiếu - Nhóm 4 |
| MSSV / Danh sách MSSV | DE200322 |
| Giảng viên hướng dẫn | Chưa cập nhật |
| Ngày hoàn thành reflection | 08/06/2026 |

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
Trong project DevTrack AI, em dùng AI xuyên suốt nhưng không dùng theo kiểu để AI làm hết. Giai đoạn đầu em dùng ChatGPT/Gemini/Claude để brainstorm ý tưởng, phân tích requirement, use case, ERD và hướng traceability. Khi vào code, em dùng Codex nhiều hơn để đọc codebase, chia việc thành phase, hỗ trợ implement RTM, Sprint Weekly Planning và Code Insight. Với giao diện/prototype, em có tham khảo Stitch nhưng vẫn chỉnh lại theo cấu trúc React/Vite thật của project.

AI giúp em đi nhanh hơn ở các phần phức tạp như RTM đọc nhiều bảng, Sprint business rule và Code Insight liên quan GitHub evidence, scoring, review snapshot. Tuy vậy, các kết quả AI đều được kiểm tra lại bằng schema, commit, test, build hoặc manual test. Những phần quá rộng hoặc rủi ro, ví dụ AI auto-approve task hoặc semantic linking bằng AI, em không đưa vào bản hiện tại.
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

- [x] ChatGPT
- [x] Gemini
- [x] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [ ] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [x] Công cụ khác: Codex, Stitch

### Công cụ được sử dụng nhiều nhất

```text
Codex
```

### Lý do sử dụng công cụ đó

```text
Codex đọc được codebase local, chạy lệnh kiểm tra, xem git history và hỗ trợ chỉnh file trong workspace. Vì project có nhiều module backend/frontend và cần đối chiếu với commit/test thật, Codex phù hợp hơn cho giai đoạn implementation và audit log.
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
- [x] Chuẩn bị thuyết trình
- [x] Tìm hiểu công nghệ mới
- [ ] Khác: ....................................

### Mô tả chi tiết

```text
AI hỗ trợ em rõ nhất ở ba module: RTM, Sprint và Code Insight. Với RTM, AI giúp em nghĩ theo hướng read-only aggregation để tránh sửa dữ liệu của module khác. Với Sprint, AI giúp làm rõ Sprint là timebox cho task chứ không phải deadline của requirement. Với Code Insight, AI giúp chia kiến trúc lớn thành các phase nhỏ: review gate, config, shared GitHub Integration, GitHub evidence, evidence linking, scoring, evidence drawer, changed files, AI summary, audit snapshot, dashboard và CI risk fix.
```

---

## 6. AI có giúp em/nhóm học tốt hơn không?

### 6.1. Những điểm AI giúp em/nhóm học tốt hơn

```text
AI giúp em hiểu nhanh hơn cách thiết kế module có nhiều liên kết dữ liệu. Trước đây em dễ nhìn từng feature riêng lẻ, nhưng qua RTM và Code Insight em hiểu hơn về traceability, audit evidence và cách chứng minh tiến độ bằng dữ liệu. AI cũng giúp em học cách chia task thành phase nhỏ để dễ test, thay vì làm một feature lớn rồi mới phát hiện lỗi.
```

Gợi ý:

- Hiểu bài nhanh hơn.
- Có thêm ví dụ minh họa.
- Biết cách debug lỗi.
- Biết thêm cách tổ chức code.
- Biết thêm cách thiết kế giải pháp.
- Biết cách viết test case.
- Biết cách cải thiện báo cáo hoặc slide.

### 6.2. Những điểm AI chưa giúp tốt hoặc gây khó khăn

```text
AI đôi lúc đưa ra scope quá rộng hoặc đề xuất cách làm nghe hay nhưng không hợp với codebase hiện tại. Ví dụ nếu để Code Insight có GitHub config riêng thì sẽ trùng với Issue Tracker. Một số logic scoring cũng cần manual test mới thấy vấn đề, như failed CI mà vẫn READY. Vì vậy nếu chỉ tin AI thì có thể tạo ra feature nhìn đúng nhưng nghiệp vụ sai.
```

Gợi ý:

- AI trả lời sai.
- AI sinh code không chạy.
- AI hiểu sai yêu cầu đề bài.
- AI đưa giải pháp quá phức tạp.
- AI thiếu ngữ cảnh môn học.
- AI trả lời chung chung.
- AI khiến em/nhóm dễ phụ thuộc.

### 6.3. Em/nhóm có bị phụ thuộc vào AI không?

- [ ] Không phụ thuộc
- [x] Phụ thuộc ít
- [ ] Phụ thuộc trung bình
- [ ] Phụ thuộc nhiều

Giải thích:

```text
Em có dùng AI nhiều, nhưng chủ yếu để hỗ trợ phân tích, review và tăng tốc. Em vẫn phải tự quyết định scope, đọc code, chạy test, kiểm tra git history và sửa logic khi phát hiện sai. Những phần AI gợi ý nhưng rủi ro như auto-approve hoặc semantic linking thì em không dùng.
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
- [x] Tra cứu tài liệu chính thống
- [x] Thảo luận với thành viên nhóm
- [x] Kiểm tra bằng dữ liệu mẫu
- [x] So sánh trước và sau khi dùng AI
- [ ] Khác: ....................................

### Mô tả quá trình kiểm chứng

```text
Em kiểm chứng bằng nhiều lớp. Đầu tiên là đọc codebase và schema thật để xem AI có đang giả định sai không. Sau đó chạy backend compile/test hoặc targeted test cho module đang làm. Với frontend thì chạy build hoặc parser check; có lúc Vite build bị sandbox `spawn EPERM`, em ghi rõ là lỗi môi trường và build lại ngoài sandbox theo log. Với các bug nghiệp vụ như Redis cache hoặc failed CI risk, em kiểm chứng bằng manual test và dữ liệu mẫu.
```

### Ví dụ cụ thể về một lần kiểm chứng

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Code Insight scoring có numeric score và risk level để leader review task |
| Em/nhóm đã kiểm tra bằng cách nào? | Manual test Case04 có failed CI/check nhưng UI vẫn hiển thị `75/100 READY` |
| Kết quả kiểm tra | Cần chỉnh sửa |
| Em/nhóm đã xử lý tiếp như thế nào? | Sửa rule để failed CI/check là hard gate, risk phải `BLOCKED`; chạy `.\mvnw.cmd "-Dtest=CodeInsightScoringServiceImplTest" test` |

---

## 8. Ví dụ AI gợi ý sai hoặc chưa phù hợp

Ghi lại ít nhất một ví dụ nếu có.

| Nội dung | Mô tả |
|---|---|
| AI đã gợi ý gì? | Code Insight ban đầu có thể tách GitHub repository/webhook config riêng |
| Vì sao gợi ý đó sai/chưa phù hợp? | Trong develop đã có GitHub Integration của Issue Tracker, nếu Code Insight giữ config riêng sẽ duplicate và khó bảo trì |
| Em/nhóm phát hiện bằng cách nào? | Khi merge develop và kiểm tra code/module GitHub Integration hiện có |
| Em/nhóm đã sửa như thế nào? | Refactor Code Insight dùng shared `github_integrations`, cleanup phần duplicate và giữ behavior Issue Tracker |
| Bài học rút ra | Trước khi thêm feature mới phải đọc codebase hiện tại, đặc biệt các module của thành viên khác |

Nếu không có trường hợp AI gợi ý sai, hãy ghi rõ:

```text
Trong quá trình thực hiện, em/nhóm có ghi nhận một số gợi ý AI chưa phù hợp và đã chỉnh sửa trước khi sử dụng, như duplicate GitHub config hoặc scoring failed CI chưa đủ chặt.
```

---

## 9. Phần đóng góp thật sự của sinh viên/nhóm

Mô tả rõ phần nào là đóng góp chính của sinh viên/nhóm, không phải chỉ copy từ AI.

```text
Đóng góp chính của em là triển khai và kiểm chứng các module liên quan RTM, Sprint Weekly Planning và Code Insight. Em tự quyết định scope từng phase, kiểm tra codebase thật, xử lý merge với develop, chạy test và sửa các lỗi nghiệp vụ. AI có hỗ trợ code và phân tích, nhưng phần quyết định không sửa dữ liệu module khác, dùng shared GitHub Integration, giữ AI review ở mức local summary và failed CI phải BLOCKED là các quyết định em kiểm tra và chịu trách nhiệm.
```

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
| Hiểu yêu cầu | Dễ nghĩ project chỉ là task management | Hiểu rõ hướng requirement-centric và evidence-based | Scope rõ hơn |
| Phân tích bài toán | Chưa nhìn đủ actor/artifact | Có flow Requirement -> Evidence -> RTM | Traceability tốt hơn |
| Thiết kế giải pháp | Dễ gom feature quá lớn | Biết chia RTM/Sprint/Code Insight thành phase | Dễ implement/test hơn |
| Code/Implementation | Có thể làm rời rạc từng file | Bám controller-service-repository, feature folder | Code dễ review hơn |
| Debug/Testing | Dễ đoán lỗi theo cảm giác | Kiểm tra bằng test, cache, schema, manual case | Ít bỏ sót lỗi nghiệp vụ |
| Báo cáo/Thuyết trình | Nội dung dễ chung chung | Có script, diagram và log theo evidence | Dễ giải thích với thầy cô |
| Làm việc nhóm | Dễ chạm module nhau | Ghi rõ ownership và dùng shared integration | Giảm conflict/trùng chức năng |

---

## 11. Bài học về môn học

Sau bài tập/project này, em/nhóm học được gì về kiến thức môn học?

```text
Em học được cách làm project phần mềm theo quy trình có traceability. Requirement không nên đứng riêng mà cần liên kết được tới use case, task, test case, bug và evidence. Em cũng hiểu hơn về backend layering, Flyway migration, REST API, React feature-based structure, GitHub integration, test và cách viết changelog/audit log có minh chứng. Một bài project nhóm không chỉ là code chạy được mà còn phải có tài liệu, tracking, evidence và khả năng giải thích quyết định kỹ thuật.
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
Em học được là phải ghi lại AI đã hỗ trợ ở đâu và không được nhận toàn bộ kết quả AI là công sức của mình. AI có thể giúp rất nhanh nhưng cũng có thể sai, thiếu context hoặc đưa ra giải pháp quá rộng. Vì vậy cần kiểm chứng bằng code/test/evidence và phải hiểu được phần mình nộp. Với những phần nhạy cảm như review task, AI chỉ nên hỗ trợ tóm tắt hoặc gợi ý, còn quyết định cuối phải do con người chịu trách nhiệm.
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
Em sẽ tiếp tục dùng AI nhưng phải có log, có bằng chứng và có kiểm chứng. Nếu AI gợi ý phần nào em không hiểu hoặc không test được thì em sẽ không đưa vào bài.
```

---

## 14. Kế hoạch cải thiện lần sau

Lần sau em/nhóm sẽ sử dụng AI tốt hơn bằng cách nào?

```text
Lần sau em sẽ ghi prompt và kết quả ngay sau mỗi giai đoạn, không để cuối mới tổng hợp. Khi hỏi AI về code, em sẽ đưa rõ file liên quan, commit hiện tại, rule nghiệp vụ, test cần chạy và phạm vi không được sửa. Em cũng muốn tách rõ prompt brainstorm, prompt review, prompt debug và prompt implementation để audit dễ đọc hơn.
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
| Ghi nhận việc dùng AI trung thực | 5 | Có 15 log/prompt chính |
| Prompt có mục tiêu rõ ràng | 4 | Một số prompt ban đầu còn rộng |
| Kiểm chứng kết quả AI | 5 | Có test/build/manual check |
| Tự chỉnh sửa/cải tiến | 5 | Có chỉnh scope, merge direction, CI risk |
| Hiểu nội dung đã nộp | 4 | Các phần phức tạp như GitHub evidence cần tiếp tục ôn lại |
| Reflection có chiều sâu | 4 | Có nêu cả hạn chế và lỗi AI |
| Sử dụng AI có trách nhiệm | 5 | Không ghi task tương lai là đã hoàn thành |

---

## 16. Câu hỏi tự vấn cuối bài

Trả lời ngắn gọn các câu hỏi sau.

### 16.1. Nếu giảng viên hỏi về phần AI đã hỗ trợ, em/nhóm có giải thích lại được không?

```text
Có. Em có thể giải thích AI hỗ trợ ở phần brainstorm, thiết kế, code, debug, test và report; đồng thời chỉ ra commit/file/test tương ứng cho từng phần.
```

### 16.2. Nếu không có AI, em/nhóm có thể tự làm lại phần quan trọng nhất không?

```text
Có thể làm lại nhưng sẽ mất nhiều thời gian hơn, nhất là Code Insight. Em vẫn hiểu được workflow chính: review gate, GitHub evidence, scoring, leader decision và audit snapshot.
```

### 16.3. Phần nào trong bài thể hiện rõ nhất năng lực thật sự của em/nhóm?

```text
Phần Code Insight theo phase và RTM read-only thể hiện rõ nhất vì cần hiểu codebase, database, workflow nhóm và phải kiểm chứng bằng test.
```

### 16.4. Em/nhóm muốn cải thiện kỹ năng nào sau bài này?

```text
Em muốn cải thiện kỹ năng viết test frontend/e2e, thiết kế API rõ hơn và ghi log dự án đều hơn sau mỗi sprint.
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
| Nguyễn Minh Hiếu | 08/06/2026 |
