# Prompt Log

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
| Ngày bắt đầu | 18/05/2026 |
| Ngày cập nhật gần nhất | 27/06/2026 |

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
- [x] Gemini
- [x] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Microsoft Copilot
- [ ] Perplexity
- [x] Công cụ khác: Stitch, Kiro

---

## 4. Danh sách các Prompt tiêu biểu

### Phase 1: Lên ý tưởng, Giao diện & Kiến trúc Database (18/05 - 28/05)

## Prompt #01
- Date: 2026-05-18
- AI Tool: Gemini
- Author: Trần Công Tú
- Purpose: Tìm kiếm thông tin và lên ý tưởng cốt lõi.

### Prompt
Chào bạn, hiện tại nhóm chúng tôi đang lên ý tưởng để làm một đồ án tốt nghiệp cho môn học SWP391. Tên đề tài dự kiến là "Software Project Management System for IT Student Teams". Yêu cầu của giảng viên là không được làm một hệ thống chung chung như Jira hay Trello, mà phải có những chức năng bám sát vào việc sinh viên làm đồ án trên trường. Bạn hãy đóng vai là một chuyên gia quản lý dự án và tư vấn giúp tôi các module cốt lõi cần phải có. Hãy tập trung vào việc quản lý tiến độ, phân chia công việc, và đặc biệt là cơ chế đánh giá điểm số đóng góp của từng thành viên trong nhóm.

### Expected Output
- Danh sách các module chính, điểm khác biệt.

### Evaluation
Gemini gợi ý tốt, chỉ ra được điểm khác biệt là tích hợp module "Đánh giá Contribution" và "Chấm điểm Mentor". Tôi lọc ra 3 module cốt lõi để làm: Task Management, Evaluation, UML Drawing.


## Prompt #02
- Date: 2026-05-19
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Phân tích và sinh Use Case cho hệ thống.

### Prompt
Sau khi chốt được các module cốt lõi, bây giờ tôi cần viết tài liệu đặc tả yêu cầu (Requirement Specification). Dựa vào ý tưởng hệ thống quản lý đồ án sinh viên với 3 vai trò chính là Student, Mentor và Admin. Bạn hãy phân tích và viết cho tôi một danh sách Use Case hoàn chỉnh. Ngoài ra, hãy tư vấn cho tôi nên sử dụng hệ quản trị cơ sở dữ liệu nào là phù hợp nhất, đảm bảo được tính toàn vẹn của dữ liệu điểm số, mượt mà khi truy vấn các quan hệ phức tạp giữa Task, Sinh viên và Nhóm, đồng thời có khả năng mở rộng tốt.

### Expected Output
- Danh sách UC theo Actor.
- Đặc tả Use Case Create Task.

### Evaluation
Claude phân tích rất sâu nhưng Use Case "Create Task" bị dư thừa bước approve của Mentor (thực tế sinh viên tự giao task). Tôi đã bỏ bước này trong file Requirement thực tế.


## Prompt #03
- Date: 2026-05-20
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Breakdown Task thành các chức năng nhỏ hơn.

### Prompt
Phân rã Use Case "Vẽ UML trên Web" thành các task lập trình chi tiết (Frontend, Backend). Yêu cầu chỉ tập trung vào chức năng vẽ Class Diagram.

### Expected Output
- WBS (Work Breakdown Structure) cho tính năng UML.

### Evaluation
Claude chia khá chuẩn, gợi ý dùng thư viện đồ họa kéo thả động. Rất hữu ích để đưa vào bảng kế hoạch.


## Prompt #04
- Date: 2026-05-22
- AI Tool: Stitch
- Author: Trần Công Tú
- Purpose: Tạo mockup UI cho trang Dashboard.

### Prompt
Hiện tại tôi đang cần thiết kế giao diện cho trang Dashboard quản lý dự án. Yêu cầu giao diện phải sáng sủa, hiện đại và sử dụng thư viện TailwindCSS. Cấu trúc DOM cần thiết kế nông và gọn gàng, sử dụng CSS Grid để chia layout. Trang Dashboard sẽ bao gồm một Sidebar bên trái chứa các menu điều hướng, một Header hiển thị thông tin người dùng đang đăng nhập, và phần nội dung chính chia làm hai cột. Cột bên trái sẽ hiển thị danh sách các task cần làm trong tuần, cột bên phải sẽ để trống để sau này tôi tự tích hợp thư viện biểu đồ vào.

### Expected Output
- Code HTML/Tailwind cho Dashboard.

### Evaluation
Stitch gen ra khung giao diện khá đẹp, nhưng phần biểu đồ chỉ là box trống. Tôi tự chèn thư viện Chart.js vào sau đó để biểu diễn dữ liệu thật.


## Prompt #05
- Date: 2026-05-24
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Truy tìm nguyên nhân UI có vẻ chạy được nhưng thực chất là lừa dối (Mock Data).

### Prompt
Tôi vừa sử dụng đoạn code giao diện UI mà một AI khác tạo ra. Giao diện hiển thị lên trình duyệt rất đẹp và đúng ý tôi, trên màn hình có hiện sẵn một danh sách các Task. Tuy nhiên, tôi phát hiện ra đây chỉ là dữ liệu tĩnh được hardcode sẵn trong một mảng. Khi tôi thử bấm nút thêm Task mới trên giao diện thì danh sách này hoàn toàn không thay đổi hay dài ra. Bạn hãy hướng dẫn tôi cách bóc tách toàn bộ phần dữ liệu mảng tĩnh này ra khỏi giao diện, và chuẩn bị các hàm fetch dữ liệu bằng React Query để tôi có thể kết nối với API thực tế từ Backend sau này.

### Expected Output
- Phân tích nguyên nhân tĩnh hóa dữ liệu của file React.

### Evaluation
Kiro chỉ ra AI đã hardcode sẵn dữ liệu vào mảng (mock data) thay vì gọi fetch lên API Backend. Ngay lập tức, tôi đưa lỗi này sang Antigravity và yêu cầu nó đập đi viết lại, kết nối 100% với RESTful API thật sự để chuẩn bị cho phase sau.


## Prompt #06
- Date: 2026-05-26
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Quản lý thay đổi cấu trúc Database (DB Migration).

### Prompt
Dự án của tôi sẽ sử dụng PostgreSQL làm cơ sở dữ liệu chính và chuẩn bị bước vào giai đoạn code Backend bằng Node.js. Để quản lý vòng đời của cơ sở dữ liệu một cách chuyên nghiệp, tôi không muốn sử dụng lệnh ALTER TABLE thủ công trên pgAdmin vì rất dễ gây lỗi mất dữ liệu và khó đồng bộ giữa các thành viên. Bạn hãy tư vấn cho tôi cách tích hợp hệ thống quản lý Database Migration, cụ thể là Knex.js. Hãy hướng dẫn tôi cách khởi tạo thư mục migration, cấu hình file knexfile.js kết nối với database, và viết một script migration mẫu để tạo bảng đầu tiên. Cần tích hợp sẵn cơ chế Optimistic Locking (thêm trường version vào các bảng) để ngăn chặn lỗi đụng độ dữ liệu.

### Expected Output
- Kiến trúc DB Migration chuyên nghiệp.

### Evaluation
Claude tư vấn dùng Knex Migration. Việc kiểm soát thay đổi DB bằng file code giúp tôi dễ dàng rollback nếu deploy bị lỗi. Tôi mang cấu trúc này bắt Antigravity tích hợp vào toàn dự án, chấm dứt ý định sửa DB bằng tay.


## Prompt #07
- Date: 2026-05-28
- AI Tool: Gemini
- Author: Trần Công Tú
- Purpose: Quyết định nền tảng thư viện đồ họa cốt lõi.

### Prompt
Ban đầu tôi định dùng Mermaid.js để vẽ biểu đồ UML nhưng nó quá tĩnh và không cho phép kéo thả. Có giải pháp nào khác cho React mà chuyên biệt để xây dựng Diagram tương tác thực sự không?

### Expected Output
- Đề xuất thư viện kéo thả xịn cho Module UML.

### Evaluation
Gemini đã giới thiệu tôi React Flow. Việc tôi không chấp nhận dùng một tool kém chỉ vì nó dễ làm, và chủ động research liên tục, đã giúp định hình kiến trúc đồ họa của dự án ở đẳng cấp cao hơn hẳn trước khi bắt tay vào code.


### Phase 2: Code Core Backend & Fix Bug End-to-End (29/05 - 06/06)

## Prompt #08
- Date: 2026-05-29
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Code tính năng phân quyền User.

### Prompt
Bây giờ chúng ta sẽ bắt đầu code chức năng xác thực và phân quyền cho Backend bằng Express.js. Bạn hãy viết cho tôi một đoạn Middleware có nhiệm vụ kiểm tra và giải mã JWT token từ header của request. Hệ thống có 3 role chính là ADMIN, MENTOR, và STUDENT. Middleware này cần nhận tham số role đầu vào và đối chiếu với role trong token. Ví dụ nếu route yêu cầu quyền MENTOR mà user gửi token của STUDENT thì phải trả về lỗi 403 Forbidden. Lưu ý, bạn phải xử lý cả trường hợp token bị hết hạn hoặc không hợp lệ.

### Expected Output
- Code đoạn `authMiddleware.js`.

### Evaluation
Antigravity viết đúng logic cơ bản, nhưng quên check case token bị expired. Tôi đã tự đọc document của jsonwebtoken và thêm block try-catch để handle TokenExpiredError.


## Prompt #09
- Date: 2026-05-30
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Tìm bug đăng nhập không lưu được token.

### Prompt
Tôi đang gặp một lỗi khá đau đầu khi kết nối Frontend với Backend. Mặc dù quá trình đăng nhập qua API trả về thành công và server có set cookie chứa JWT token, nhưng khi Frontend gọi các API tiếp theo, trình duyệt lại báo lỗi CORS và cookie hoàn toàn không được đính kèm vào request. Tôi đang chạy Frontend ở localhost:3000 và Backend ở localhost:8080. Bạn hãy đọc đoạn log lỗi này và giải thích chi tiết cho tôi nguyên nhân tại sao trình duyệt lại từ chối gửi cookie, và liên quan gì đến thuộc tính SameSite.

### Expected Output
- Xác định nguyên nhân lỗi CORS và SameSite cookie.

### Evaluation
Kiro dò bug rất nhanh, báo lỗi do thiếu credentials: true ở Axios và SameSite=none ở cookie.


## Prompt #10
- Date: 2026-05-31
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Fix bug CORS theo gợi ý của Kiro.

### Prompt
Dựa trên nguyên nhân lỗi CORS và SameSite cookie vừa tìm ra, bây giờ bạn hãy hướng dẫn tôi cách cấu hình lại file server.js trong Express. Cụ thể, tôi cần cấu hình thư viện cors để cho phép origin từ Frontend, và quan trọng nhất là phải bật thông số allow-credentials lên true. Ngoài ra, hãy hướng dẫn tôi cách cấu hình cookie trả về từ API đăng nhập với các thuộc tính httpOnly, SameSite là None, và Secure là true. Vui lòng sử dụng biến môi trường (environment variables) cho domain gốc để bảo mật.

### Expected Output
- File `server.js` được cập nhật.

### Evaluation
Antigravity fix thành công. Code đã chạy mượt.


## Prompt #11
- Date: 2026-06-02
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Code API Create Task có tính toán estimate time.

### Prompt
Tiếp theo, bạn hãy viết cho tôi API POST /api/tasks để tạo công việc mới. Input nhận vào từ body sẽ bao gồm title, description, assignee_id, và estimate_hours. Logic nghiệp vụ yêu cầu phải validate dữ liệu đầu vào, nếu estimate_hours lớn hơn 40 thì phải trả về lỗi "Quá thời gian cho phép của một tuần". Sau khi qua bước validate, hãy viết code lưu dữ liệu này xuống PostgreSQL. Dưới đây là bộ luật Strict Backend Rule của tôi, yêu cầu bạn tuân thủ tuyệt đối, không được viết code đối phó hay lười biếng.

### Expected Output
- Code Router, Controller, Model.

### Evaluation
Hoạt động tốt. Nhờ sự hướng dẫn, AI lưu đúng xuống PostgreSQL. Tôi đã yêu cầu Claude gen thêm schema Zod để thay thế các câu validate if-else lộn xộn ban đầu.


## Prompt #12
- Date: 2026-06-04
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Phát hiện lỗ hổng API báo 200 nhưng không lưu data vào PostgreSQL (End-to-End Testing).

### Prompt
Tôi vừa test thử API tạo Task mà một AI khác viết bằng Postman. Postman báo về HTTP Status 200 Success, kèm theo message báo tạo thành công. Tuy nhiên, khi tôi cẩn thận mở công cụ pgAdmin để kiểm tra trực tiếp vào bảng Tasks trong PostgreSQL thì hoàn toàn không thấy có dòng dữ liệu nào mới được thêm vào cả. Đoạn code controller này đang có vấn đề gì? Phải chăng nó chỉ đang in thông tin ra màn hình console chứ chưa hề gọi lệnh thực thi xuống cơ sở dữ liệu? Bạn hãy kiểm tra giúp tôi.

### Expected Output
- Phát hiện AI Coder giả mạo truy vấn.

### Evaluation
Kiro bóc mẽ rằng Antigravity chỉ console.log câu query SQL chứ chưa gọi hàm pool.query thực thi xuống Database. Sự phát hiện E2E Testing này giúp tôi chặn đứng thói lười biếng của AI. Tôi bắt Antigravity sửa lại và nối vào CSDL lập tức.


### Phase 3: Module UML & Tương tác giao diện (07/06 - 15/06)

## Prompt #13
- Date: 2026-06-07
- AI Tool: Gemini
- Author: Trần Công Tú
- Purpose: So sánh chi tiết thư viện vẽ biểu đồ.

### Prompt
Module vẽ biểu đồ UML là linh hồn của dự án này. Trước khi bắt tay vào code, tôi cần bạn phân tích và so sánh chi tiết giúp tôi 3 thư viện vẽ biểu đồ trên nền tảng React: React Flow, JointJS, và GoJS. Tiêu chí đánh giá của tôi là thư viện phải hoàn toàn mã nguồn mở, tài liệu document phong phú dễ tiếp cận, cộng đồng hỗ trợ lớn, và quan trọng nhất là phải dễ dàng tùy biến các Node và Edge để phù hợp với việc vẽ Class Diagram có các thuộc tính và phương thức.

### Expected Output
- Bảng so sánh 3 thư viện.

### Evaluation
Gemini phân tích tốt. JointJS và GoJS thương mại nhiều, React Flow phù hợp nhất với dự án môn học. Đây là bước research cuối cùng trước khi vào code.


## Prompt #14
- Date: 2026-06-08
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Lên luồng xử lý (prompt engineering) để hướng dẫn Antigravity code UML.

### Prompt
Sau khi cân nhắc, tôi đã quyết định chọn thư viện React Flow làm nền tảng cốt lõi để xây dựng tính năng kéo thả biểu đồ Class Diagram. Vì đây là một thư viện phức tạp, tôi cần bạn đóng vai là một kỹ sư hệ thống, vạch ra cho tôi một bản thiết kế kiến trúc toàn diện (Master Prompt). Bản thiết kế này cần mô tả rõ ràng cấu trúc dữ liệu JSON để lưu trữ state của các Node và Edge, cách thiết lập các điểm neo kết nối (Handle), và cách quản lý luồng dữ liệu khi người dùng kéo thả.

### Expected Output
- Một đoạn Prompt chi tiết mô tả logic cần implement.

### Evaluation
Claude tạo ra prompt rất kỹ, mô tả rõ cấu trúc data của React Flow. Việc này giúp tôi kiểm soát hoàn toàn thiết kế hệ thống trước khi bắt đầu code.


## Prompt #15
- Date: 2026-06-09
- AI Tool: Stitch
- Author: Trần Công Tú
- Purpose: Tạo giao diện Toolpad chứa các hình khối UML.

### Prompt
Bây giờ tôi cần thiết kế giao diện cho phần công cụ vẽ biểu đồ. Bạn hãy tạo cho tôi một component Sidebar nằm dọc ở bên trái màn hình. Component này sẽ đóng vai trò như một hộp công cụ, chứa 3 nút bấm tương ứng với 3 loại hình khối: Class, Interface, và Enum. Yêu cầu quan trọng là các nút bấm này phải có khả năng kéo thả (Drag and Drop) được. Hãy sử dụng TailwindCSS để style cho Sidebar trông hiện đại và chuyên nghiệp, có hiệu ứng hover khi người dùng di chuột vào các công cụ.

### Expected Output
- Component `Sidebar.tsx`.

### Evaluation
Giao diện đẹp. Tuy nhiên thuộc tính kéo thả (HTML5 Drag Drop) Stitch gen bị thiếu hàm onDragStart, tôi yêu cầu AI bổ sung lại logic sự kiện này.


## Prompt #16
- Date: 2026-06-11
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Implement logic React Flow.

### Prompt
Dựa trên bản thiết kế kiến trúc Master Prompt mà tôi cung cấp dưới đây, bạn hãy bắt tay vào code component chính UmlDiagram.jsx sử dụng React Flow. Component này cần bao gồm một vùng Canvas rộng lớn chiếm phần còn lại của màn hình. Nó phải có khả năng lắng nghe sự kiện khi người dùng kéo một công cụ từ Sidebar và thả (drop) vào vùng Canvas, sau đó lấy tọa độ chuột và thêm một Custom Node mới vào state của biểu đồ. Hãy chú ý xử lý tính năng kéo thả cẩn thận.

### Expected Output
- React component xử lý diagram.

### Evaluation
Antigravity code ra nhưng logic liên kết (Edge) bị lỗi, không dính vào các thẻ (Handle) của Node. Tôi nhận ra AI không hiểu rõ cấu trúc Custom Node của mình.


## Prompt #17
- Date: 2026-06-12
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Tìm bug tại sao Edge không nối được vào Node.

### Prompt
Tôi đang gặp một lỗi nghiêm trọng với tính năng vẽ biểu đồ. Các khối Custom Node đã hiển thị thành công lên màn hình, nhưng khi tôi dùng chuột bấm vào các điểm neo (Handle) để kéo một đường dây kết nối (Edge) sang khối khác, thì đường dây không hề bám dính vào. Cứ kéo thả chuột ra là đường dây biến mất không lưu lại trong state. Tôi gửi kèm đây đoạn code của CustomNode.jsx và log lỗi hiển thị trên trình duyệt. Bạn hãy phân tích xem tại sao sự kiện onConnect lại không hoạt động như mong đợi.

### Expected Output
- Phân tích bug.

### Evaluation
Kiro phát hiện ra ID của Handle trong CustomNode không trùng khớp với ID khi hàm onConnect bắn ra. Do AI gen code ở file A khác chuẩn với file B.


## Prompt #18
- Date: 2026-06-13
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Fix logic onConnect của React Flow.

### Prompt
Dựa trên nguyên nhân lỗi vừa tìm ra là do ID của các điểm neo (Handle) bị đặt sai lệch, bạn hãy viết lại đoạn logic xử lý sự kiện onConnect cho component biểu đồ. Lần này, tôi yêu cầu bạn phải tuyệt đối tuân thủ theo chuẩn đặt tên mà tôi đã quy định: điểm neo phía trên phải có ID là 'top-handle' và phía dưới là 'bottom-handle'. Hãy sử dụng hàm addEdge của thư viện React Flow để cập nhật state một cách chính xác, đảm bảo dây kết nối không bị biến mất sau khi thả chuột.

### Expected Output
- Fix bug nối mép UML.

### Evaluation
Thành công. Tôi nhận ra nếu không tự check code và đồng bộ ID giữa các file thì AI sẽ cứ tự ảo giác và sinh ra logic sai lệch.


## Prompt #19
- Date: 2026-06-14
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Tìm lỗi State management (Undo/Redo).

### Prompt
Tính năng hoàn tác (Undo/Redo) của biểu đồ đang làm hiệu năng của trang web bị giảm sút trầm trọng. Khi số lượng node trên màn hình tăng lên khoảng 50 node, mỗi lần tôi kéo thả một node đi chỗ khác là giao diện bị giật lag rõ rệt. Dưới đây là đoạn code file useUndoRedo.js mà tôi đang dùng để lưu lịch sử mảng state vào một mảng history. Bạn hãy đọc code và chỉ ra cho tôi nguyên nhân cốt lõi gây ra tình trạng tụt FPS này, có phải do việc clone toàn bộ object quá lớn gây tràn bộ nhớ không?

### Expected Output
- Nguyên nhân hiệu năng kém.

### Evaluation
Kiro báo lỗi do lưu cả Object quá to vào state thay vì chỉ lưu Delta (sự thay đổi). 


## Prompt #20
- Date: 2026-06-15
- AI Tool: Antigravity
- Author: Trần Công Tú
- Purpose: Tối ưu hoá Undo/Redo.

### Prompt
Tôi đồng ý với phân tích của bạn, việc lưu toàn bộ mảng dữ liệu khổng lồ mỗi khi có thay đổi nhỏ là không thể chấp nhận được. Bây giờ, tôi không muốn dùng cách lưu nguyên mảng cũ nữa. Bạn hãy viết lại toàn bộ custom hook Undo/Redo này theo hướng tối ưu hóa bộ nhớ. Cụ thể, hãy sử dụng thư viện Lodash với hàm debounce để gộp các thao tác kéo thả liên tục lại thành một lần lưu duy nhất. Ngoài ra, hãy cố gắng chỉ lưu lại những trạng thái thực sự bị thay đổi (delta) thay vì clone toàn bộ.

### Expected Output
- Code tối ưu hóa (Refactor).

### Evaluation
Antigravity viết ban đầu khá phức tạp. Thay vì tự code tay, tôi mang code rườm rà đó ném sang cho Claude để nhờ nó phân tích và tối ưu hóa cho sạch sẽ hơn. Sau khi Claude đưa ra bản rút gọn dễ hiểu, tôi yêu cầu Antigravity implement lại. Sự kết hợp chéo này giúp hệ thống vừa mượt vừa clear code.


### Phase 4: Bảo mật, Tối ưu hóa hệ thống & DevOps (16/06 - 27/06)

## Prompt #21
- Date: 2026-06-18
- AI Tool: Kiro
- Author: Trần Công Tú
- Purpose: Xử lý lỗi Crash UI khi đụng độ khóa Optimistic Locking.

### Prompt
Nhờ việc cấu hình Optimistic Locking từ những ngày đầu, hệ thống cơ sở dữ liệu đã tự động chặn đứng được thao tác ghi đè khi 2 user cùng chỉnh sửa một Task và báo lỗi version conflict. Tuy nhiên, vấn đề hiện tại nằm ở Frontend. Do không đón được lỗi này, toàn bộ ứng dụng React của tôi bị văng ra thành một màn hình trắng xóa cực kỳ phản cảm. Bạn hãy hướng dẫn tôi cách xây dựng cơ chế Error Boundary trong React để bắt các lỗi không lường trước này, thay vào đó hiển thị một thông báo lịch sự yêu cầu người dùng tải lại trang.

### Expected Output
- Giải pháp Error Boundary & Graceful Degradation.

### Evaluation
Kiro tìm ra lỗi do Frontend thiếu cơ chế Error Boundary bọc quanh Component. Tôi nhờ Claude thiết kế lại UI/UX popup báo lỗi, rồi ép Antigravity code ErrorBoundary. Sự kết hợp hoàn hảo bảo vệ hệ thống từ sâu thẳm DB lên tới trải nghiệm UX bề mặt.


## Prompt #22
- Date: 2026-06-20
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Tái cấu trúc (Refactoring Technical Debt).

### Prompt
File UmlDiagram.jsx của dự án hiện tại đã phình to lên tới hơn 1500 dòng code. Nó đang ôm đồm quá nhiều trách nhiệm: từ việc render giao diện, xử lý kéo thả, gọi API lưu dữ liệu, cho đến quản lý kết nối Socket realtime. Tình trạng "nợ kỹ thuật" này khiến việc bảo trì trở nên bất khả thi. Bạn hãy áp dụng nguyên tắc Separation of Concerns, vạch ra cho tôi một bản thiết kế tái cấu trúc hoàn chỉnh. Hãy chia nhỏ file này thành nhiều Custom Hooks riêng biệt (như useUmlState, useSocket) và tách giao diện thành các component nhỏ gọn.

### Expected Output
- Cấu trúc thư mục Component và Hook rõ ràng.

### Evaluation
Claude băm nhỏ file 1500 dòng thành 5 file nhỏ gọn, mỗi file không quá 200 dòng. Tôi đưa bản vẽ kiến trúc này ép Antigravity đập code cũ ra và chia lại. 


## Prompt #23
- Date: 2026-06-22
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Tối ưu WebSockets bị lag khi sử dụng chung (Concurrency).

### Prompt
Tính năng vẽ biểu đồ chung thời gian thực (Real-time Collaboration) đang gặp sự cố nghiêm trọng về đường truyền. Hiện tại, mỗi khi có một người dùng kéo thả một Node, hệ thống WebSockets lại gửi đi toàn bộ mảng Nodes chứa tất cả dữ liệu lên server, sau đó server lại broadcast cục dữ liệu khổng lồ đó về cho tất cả mọi người. Chỉ cần 5 người dùng chung, trình duyệt đã bị đơ cứng vì quá tải. Bạn hãy đề xuất cho tôi một thuật toán nén đường truyền, chỉ gửi đi tọa độ x,y của đúng Node đang bị thay đổi (Delta Update) kèm theo kỹ thuật Throttling.

### Expected Output
- Thuật toán tối ưu đường truyền (Network).

### Evaluation
Claude hướng dẫn tôi kỹ thuật "Delta Update" (chỉ gửi tọa độ nhỏ lẻ của điểm bị thay đổi) kết hợp Throttle. Tôi hiểu được logic này và ra lệnh cho Antigravity làm theo. Nhờ đó, 20 người vô cùng lúc web vẫn chạy êm ru.


## Prompt #24
- Date: 2026-06-25
- AI Tool: Claude
- Author: Trần Công Tú
- Purpose: Viết User Manual (Tài liệu hướng dẫn sử dụng).

### Prompt
Dự án đã cơ bản hoàn thiện, bây giờ tôi cần viết một tài liệu Hướng dẫn sử dụng (User Manual) dành cho người dùng cuối là các bạn sinh viên. Dựa trên các Use Case ban đầu và các tính năng thực tế đã làm như: Đăng nhập phân quyền, Tạo Task quản lý dự án, và Vẽ biểu đồ UML trực tuyến. Bạn hãy biên soạn cho tôi một file README.md thật chi tiết, có cấu trúc mục lục rõ ràng, hướng dẫn từng bước (step-by-step) cách thao tác trên hệ thống. Văn phong cần tự nhiên, dễ hiểu, không sử dụng các từ ngữ quá kỹ thuật.

### Expected Output
- File README.md hoàn chỉnh.

### Evaluation
Claude viết document cực tốt, chuyên nghiệp và có mục lục rõ ràng. Tôi chỉ việc bổ sung thêm ảnh chụp màn hình (screenshot) của app.


## Prompt #25
- Date: 2026-06-27
- AI Tool: Gemini
- Author: Trần Công Tú
- Purpose: Thiết lập CI/CD Pipeline tự động hóa DevOps.

### Prompt
Để chứng minh năng lực triển khai phần mềm theo chuẩn công nghiệp khép kín (SDLC), tôi muốn tự tự động hóa toàn bộ quá trình đưa code lên server. Bạn hãy đóng vai là một chuyên gia DevOps, hướng dẫn tôi cách thiết lập hệ thống CI/CD Pipeline bằng GitHub Actions. Yêu cầu cụ thể: Cứ mỗi khi có bất kỳ thay đổi nào được push lên nhánh main của repository, hệ thống phải tự động kích hoạt tiến trình cài đặt thư viện, chạy Unit Test, và nếu mọi thứ xanh (Pass) thì tự động deploy thẳng lên dịch vụ Render. Vui lòng viết cho tôi file deploy.yml chi tiết.

### Expected Output
- Script GitHub Actions CI/CD chuẩn mực.

### Evaluation
Gemini gen ra file deploy.yml khá chuẩn. Tuy nhiên lúc chạy trên GitHub Action bị lỗi thiếu biến môi trường DB URL. Tôi lại dùng Kiro để trace log của Actions, fix env và luồng deploy tự động đã chạy thành công rực rỡ.
