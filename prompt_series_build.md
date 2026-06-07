# PROMPT SERIES — Build UC Diagram (React Flow + ELK.js)
# Gửi từng prompt riêng cho AI build từng phần

===============================================================
## PROMPT 1 — elkLayoutEngine.js
===============================================================

Hãy build file `elkLayoutEngine.js` với yêu cầu sau:

Đây là file chịu trách nhiệm tính toán vị trí (x, y) cho tất cả các node trong Use Case Diagram, sử dụng thư viện ELK.js (elkjs/lib/elk.bundled.js).

**Input của function chính `elkLayoutEngine(actors, usecases, relations)`:**
- `actors`: mảng các object `{ id, name, alias, side }` — side có thể là "left", "right", hoặc "bottom"
- `usecases`: mảng các object `{ id, name, alias, group }` — group có thể là "left", "shared", hoặc "right"
- `relations`: mảng các object `{ id, type, from, to }` — type có thể là "actor-uc", "include", hoặc "extend"

**Yêu cầu xử lý:**
- Khởi tạo ELK instance
- Build một ELK graph từ dữ liệu input: actors và usecases đều là node, relations là edge
- Kích thước mỗi node actor: width 60, height 90
- Kích thước mỗi node usecase: width 180, height 50
- Actor có side "left" phải được gợi ý đặt ở cột đầu tiên bên trái bằng layoutOptions của ELK
- Actor có side "right" phải được gợi ý đặt ở cột cuối cùng bên phải
- Actor có side "bottom" đặt ở dưới cùng
- Cấu hình ELK algorithm dùng "layered", hướng "RIGHT", spacing giữa các layer là 120, spacing giữa các node là 40, edgeRouting là "ORTHOGONAL", crossingMinimization strategy là "LAYER_SWEEP", nodePlacement strategy là "BRANDES_KOEPF"
- Sau khi ELK tính xong, map kết quả thành React Flow nodes và edges
- Mỗi React Flow node có: id, type ("actorNode" hoặc "ucNode"), position {x, y}, data chứa toàn bộ thông tin gốc
- Mỗi React Flow edge có: id, source, target, type "smoothstep", label (rỗng nếu actor-uc, "<<include>>" nếu include, "<<extend>>" nếu extend), style màu sắc (actor-uc: #888888, include: #4A90D9, extend: #38A169), strokeDasharray "5,4" cho include và extend, markerEnd mũi tên đóng cùng màu
- Function là async, return Promise<{ nodes, edges }>
- Export default function elkLayoutEngine


===============================================================
## PROMPT 2 — ActorNode.jsx
===============================================================

Hãy build file `ActorNode.jsx` với yêu cầu sau:

Đây là React component hiển thị node Actor trong React Flow Use Case Diagram.

**Yêu cầu giao diện:**
- Hiển thị hình người UML tiêu chuẩn bằng SVG gồm: 1 hình tròn (đầu), 1 đường thẳng dọc (thân), 1 đường thẳng ngang (tay), 2 đường chéo xuống (chân trái và chân phải)
- Màu fill hình tròn đầu: #E8F4FD, màu stroke toàn bộ: #2E86AB, strokeWidth 1.5
- Kích thước SVG: width 40, height 56
- Phía dưới SVG là tên actor, font size 12, fontWeight 700, màu #1A202C, căn giữa, maxWidth 80, wordBreak "break-word", font family Segoe UI
- Toàn bộ component căn giữa theo chiều ngang, userSelect none

**Yêu cầu React Flow Handle:**
- Có đủ 4 Handle ẩn (opacity 0, width 1, height 1): source-Right, source-Left, target-Right, target-Left
- Để React Flow có thể routing edge từ bất kỳ hướng nào

**Export:** export function ActorNode


===============================================================
## PROMPT 3 — UCNode.jsx
===============================================================

Hãy build file `UCNode.jsx` với yêu cầu sau:

Đây là React component hiển thị node Use Case trong React Flow Use Case Diagram.

**Yêu cầu giao diện:**
- Hình dạng ellipse (bo tròn borderRadius 999)
- Background trắng #FFFFFF
- Border 1.5px solid, màu theo group: group "left" → #4A90D9, group "shared" → #805AD5, group "right" → #38A169
- Padding: 8px trên dưới, 18px trái phải
- Font size 11, fontWeight 500, màu #1A202C, căn giữa
- minWidth 140, maxWidth 190, lineHeight 1.4
- Font family Segoe UI
- Box shadow nhẹ: 0 1px 4px rgba(0,0,0,0.08)
- userSelect none
- Hiển thị `data.label` là tên use case

**Yêu cầu React Flow Handle:**
- Có đủ 4 Handle ẩn giống ActorNode: source-Right, source-Left, target-Right, target-Left

**Export:** export function UCNode


===============================================================
## PROMPT 4 — UCDiagram.jsx
===============================================================

Hãy build file `UCDiagram.jsx` với yêu cầu sau:

Đây là React component DÙNG CHUNG cho cả 2 chế độ: View Map (read-only) và Edit Diagram (interactive). Đây là component quan trọng nhất, nhận prop `mode` để quyết định behavior.

**Props:**
- `actors`: mảng actors
- `usecases`: mảng use cases  
- `relations`: mảng relations
- `mode`: string, giá trị "view" hoặc "edit", mặc định "view"
- `onSave`: function callback nhận nodes hiện tại khi user nhấn Save (chỉ dùng ở edit mode)

**Yêu cầu xử lý:**
- Khi component mount hoặc khi actors/usecases/relations thay đổi, gọi `elkLayoutEngine` để tính layout
- Trong lúc tính layout hiển thị loading state: icon ⏳ và text "Đang tính toán layout..." căn giữa
- Sau khi có layout, nếu mode là "view" thì set tất cả nodes có draggable: false và selectable: false
- Nếu mode là "edit" thì giữ nguyên draggable: true

**Yêu cầu React Flow:**
- Dùng `useNodesState` và `useEdgesState` để quản lý nodes và edges
- nodeTypes phải đăng ký: actorNode → ActorNode, ucNode → UCNode
- `nodesDraggable`: false nếu view, true nếu edit
- `nodesConnectable`: false nếu view, true nếu edit
- `elementsSelectable`: false nếu view, true nếu edit
- `panOnDrag`: true ở cả 2 chế độ (user vẫn có thể pan để xem)
- `zoomOnScroll`: true ở cả 2 chế độ
- `fitView`: true
- `fitViewOptions`: padding 0.12
- `minZoom`: 0.3, `maxZoom`: 2
- Background component: màu #E2E8F0, gap 24, size 1
- Controls component: chỉ hiển thị ở mode "edit"
- MiniMap component: chỉ hiển thị ở mode "edit", màu actorNode là #2E86AB, ucNode là #4A90D9

**Lưu vị trí (chỉ edit mode):**
- Khi user kéo thả xong một node, lưu tất cả positions vào localStorage với key `uc-positions-{projectId}` (nếu có prop projectId)
- Khi component mount ở edit mode, check localStorage trước, nếu có positions đã lưu thì dùng positions đó thay vì chạy ELK lại

**Export:** export function UCDiagram


===============================================================
## PROMPT 5 — Tích hợp vào View Map Page
===============================================================

Hãy chỉnh sửa trang View Map hiện tại với yêu cầu sau:

Thay thế hoàn toàn component đang dùng PlantUML PNG bằng component `UCDiagram` mới.

**Yêu cầu:**
- Import UCDiagram từ "./UCDiagram"
- Truyền đúng props: actors, usecases, relations lấy từ data hiện có của project
- Truyền `mode="view"`
- Container của UCDiagram phải có width 100% và height đủ lớn để hiển thị diagram (tối thiểu 600px, nên dùng height: "calc(100vh - 120px)" để full màn hình trừ header)
- Bỏ toàn bộ code liên quan đến gọi API PlantUML PNG cũ
- Bỏ toàn bộ code liên quan đến hiển thị ảnh PNG tĩnh
- Giữ nguyên toàn bộ phần còn lại của trang (header, breadcrumb, nút điều hướng...)


===============================================================
## PROMPT 6 — Tích hợp vào Edit Diagram Page
===============================================================

Hãy chỉnh sửa trang Edit Diagram hiện tại với yêu cầu sau:

Thay thế component React Flow cũ (đang dùng custom layout algorithm) bằng component `UCDiagram` mới.

**Yêu cầu:**
- Import UCDiagram từ "./UCDiagram"
- Truyền đúng props: actors, usecases, relations, mode="edit", projectId
- Truyền prop `onSave` là function nhận nodes và lưu positions vào backend hoặc localStorage
- Container phải có width 100% và height chiếm toàn bộ phần còn lại của màn hình sau header và panel editor
- Bỏ toàn bộ custom layout algorithm cũ
- Bỏ toàn bộ code khởi tạo React Flow cũ
- Giữ nguyên panel editor bên trái (danh sách actors, use cases, relations, nút thêm/xóa/sửa)
- Khi user thêm/xóa/sửa actor hoặc UC ở panel trái → cập nhật lại actors/usecases/relations state → UCDiagram tự re-render với layout mới


===============================================================
## PROMPT 7 — Lưu ảnh diagram
===============================================================

Hãy chỉnh sửa chức năng lưu ảnh diagram với yêu cầu sau:

Hiện tại hệ thống đang lưu ảnh PlantUML PNG. Giờ cần chuyển sang chụp ảnh React Flow.

**Yêu cầu:**
- Dùng thư viện `html-to-image` (đã có sẵn, không cần cài thêm)
- Tạo một ref gắn vào wrapper div bọc ngoài component UCDiagram
- Khi user nhấn nút Save/Export:
  1. Gọi `toPng(ref.current, { backgroundColor: "#ffffff", pixelRatio: 2 })`
  2. Nhận về dataUrl là chuỗi base64 PNG
  3. Upload dataUrl lên backend giống flow hiện tại
  4. Hiển thị toast thông báo thành công hoặc thất bại
- Nút Save chỉ hiển thị ở Edit mode, không hiển thị ở View mode
- Trong lúc đang lưu hiển thị loading spinner trên nút


===============================================================
## PROMPT 8 — Xóa PlantUML khỏi Backend
===============================================================

Hãy dọn dẹp backend với yêu cầu sau:

Sau khi frontend đã chuyển sang React Flow + ELK.js hoàn toàn, backend không còn cần PlantUML và Graphviz nữa.

**Yêu cầu:**
- Xóa hoặc deprecated endpoint `GET /api/uc-diagram/png` (hoặc tên endpoint tương tự đang generate PlantUML)
- Xóa toàn bộ code liên quan đến gọi PlantUML server
- Xóa toàn bộ code liên quan đến Graphviz
- Xóa dependency `node-plantuml`, `plantuml-encoder` hoặc bất kỳ package liên quan PlantUML nào khỏi package.json
- Nếu có Graphviz binary trên server thì ghi chú lại để devops uninstall
- Thêm endpoint mới `POST /api/uc-diagram/positions` để lưu custom positions sau khi user kéo thả: nhận body `{ projectId, positions: { [nodeId]: {x, y} } }`, lưu vào database
- Thêm endpoint `GET /api/uc-diagram/positions?projectId=xxx` để đọc positions đã lưu

===============================================================
## THỨ TỰ BUILD KHUYẾN NGHỊ

1. PROMPT 1 — elkLayoutEngine.js (nền tảng, build trước)
2. PROMPT 2 — ActorNode.jsx
3. PROMPT 3 — UCNode.jsx
4. PROMPT 4 — UCDiagram.jsx (dùng 3 file trên)
5. PROMPT 5 — Tích hợp View Map (test read-only trước)
6. PROMPT 6 — Tích hợp Edit Diagram (test interactive)
7. PROMPT 7 — Lưu ảnh
8. PROMPT 8 — Dọn dẹp backend (làm cuối cùng sau khi test xong)
===============================================================
