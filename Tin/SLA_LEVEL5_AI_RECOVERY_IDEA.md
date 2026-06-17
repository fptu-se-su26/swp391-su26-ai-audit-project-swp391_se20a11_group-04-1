# Ý Tưởng Tích Hợp AI Vào Recovery Plan (SLA Level 5)

## 1. Vấn Đề Hiện Tại (Rule-Based)
Hệ thống Recovery Plan hiện tại đã có bộ khung vững chắc: Generate, Approve/Reject, Execute, và Audit Tracking. Tuy nhiên, nội dung sinh ra (Summary, Action message) hoàn toàn dựa trên các chuỗi văn bản tĩnh được hardcode cứng nhắc, ví dụ:
> *"Task is HIGH risk because of OVERDUE. The system recommends 2 recovery actions for leader approval."*

Cách tiếp cận này hiệu quả về logic nhưng lại **thiếu đi sự linh hoạt, cảm xúc và ngữ cảnh thực tế**, làm cho người nhận (Assignee) dễ có cảm giác bị "hệ thống giám sát, ra lệnh hoặc phạt", dễ gây tâm lý chống đối hoặc áp lực không đáng có trong quá trình làm việc nhóm.

## 2. Giải Pháp: "Mềm Mại Hóa" Bằng AI
Ý tưởng cốt lõi là đưa AI vào vòng lặp (Human-in-the-loop + AI) để chuyển hóa dữ liệu thô thành những thông điệp **gần gũi, thấu cảm và tự nhiên** nhất có thể.

### Luồng Hoạt Động Đề Xuất:
1. **Thu thập bối cảnh (Context Gathering):**
   - Lấy thông tin về Task (Tên, độ ưu tiên, deadline...).
   - Lấy thông tin về Assignee (Ai đang làm, đã làm được bao lâu...).
   - Lấy nguyên nhân SLA rủi ro (Do thiếu Evidence? Do quá hạn? Bị Blocked?).
   
2. **AI Prompting (Generative Phase):**
   - Truyền bộ Context này cho AI (Gemini/ChatGPT).
   - Yêu cầu AI đóng vai một người "Trợ lý Điều phối Dự án" (Agile Coach / Scrum Master) với tone giọng điệu hỗ trợ, khích lệ.
   - Yêu cầu AI sinh ra `summary` và `action message` dựa trên dữ liệu.

3. **Kết Quả Mong Đợi (Ví dụ):**
   - **Summary cũ:** *"Task HIGH risk. Missing evidence."*
   - **AI Summary mới:** *"Task này team mình đang thiếu bằng chứng hoàn thành (Evidence), chắc là bận code quá nên quên cập nhật thôi. Leader tạo plan này để nhắc nhở nhẹ team mình update để kịp tiến độ nghen!"*
   - **Action cũ:** *"Notify assignee to update task."*
   - **AI Action mới:** *"Nhắn nhủ nhẹ nhàng tới bạn Dev đang giữ task để bạn ấy chủ động update tình hình xem có vướng mắc gì không."*

## 3. Lợi Ích & Mục Tiêu Ý Nghĩa
- **Tâm lý:** Tạo cảm giác "được hỗ trợ" thay vì "bị quản lý". Thông tin gần gũi giúp team dễ dàng tiếp nhận.
- **Cá nhân hóa:** AI có thể phân tích độ trễ của từng task để đưa ra lời nhắc với mức độ "nghiêm trọng" phù hợp (Trễ 1 ngày thì nhắc nhẹ, trễ 1 tuần thì cần khẩn cấp hơn).
- **Phát huy tối đa Level 5:** Kết hợp được sự chính xác của Logic (Code/Rule) + Quyết định của con người (Leader Approve) + Khả năng giao tiếp của Máy học (AI Text Generation), tạo ra một quy trình Recovery chuẩn Agile.
