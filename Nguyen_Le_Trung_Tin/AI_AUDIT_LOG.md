# AI Audit Log - Nguyen Le Trung Tin

## 1. Thong tin chung

| Thong tin | Noi dung |
|---|---|
| Mon hoc | SWP391 |
| Ma mon hoc | SWP391 |
| Lop | SE20A11 |
| Hoc ky | SU26 |
| Ten project | DevTrack AI |
| Sinh vien | Nguyen Le Trung Tin |
| MSSV | DE190364 |
| Module phu trach | Module 3 - Task/Kanban Management |
| Thoi gian thuc hien | 21/05/2026 - 22/05/2026 |
| Branch | feature/de190364-task-crud |
| Commit | - [feat(task): implement kanban task management](https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/7acf2fe25519c9564ff0580580eff6b2eff83390)<br>- [complete crud task](https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/69982bd62b7540b48719dbd56b54a2be52e16f83) |

## 2. Cong cu AI da su dung

- [x] ChatGPT
- [ ] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity
- [ ] Khac

## 3. Muc tieu su dung AI

Su dung AI de ho tro phan tich va trien khai Module 3 Task/Kanban cho du an DevTrack AI. Phan viec bao gom thiet ke Task Board, task detail drawer, full task detail page, My Tasks, keo tha task giua cac cot, tao/sua/xoa task, chon assignee tu thanh vien project, them backend Task API va ket noi frontend voi backend thong qua service layer.

## 4. Nhat ky su dung AI

### Lan 1 - Phan tich huong lam Module 3

| Noi dung | Thong tin |
|---|---|
| Ngay su dung | 21/05/2026 |
| Cong cu AI | ChatGPT |
| Muc dich | Xac dinh nen lam Kanban theo thu tu nao |
| Phan viec lien quan | Frontend, Backend, Design |
| Muc do su dung | Ho tro nhieu |

**Prompt tom tat**

```text
Toi dang lam do dang Module 3. Bay gio nen lam Kanban truoc, bat dau bang store + component refactor + task drawer/modal. Hay xem code va huong dan/trien khai theo cau truc phu hop.
```

**Ket qua AI goi y**

AI goi y tach Kanban thanh store, components va pages. Module nen co Task Board, TaskCard, KanbanColumn, TaskDetailDrawer, TaskFormModal va TaskDetailPage. Luong nguoi dung nen bat dau tu Task Board, click task de mo drawer, sau do co the mo full detail.

**Phan da ap dung**

- Tao cau truc `features/kanban`.
- Tach UI thanh cac component rieng.
- Them task drawer/modal.
- Them route Task Board, Task Detail va My Tasks.
- Them keo tha task giua cac cot.

**Phan tu chinh sua**

Tu kiem tra lai route, sidebar, trang reload, hanh vi dong/mo panel va cach dat folder theo convention cua team.

### Lan 2 - Chuyen tu UI demo sang huong du an that

| Noi dung | Thong tin |
|---|---|
| Ngay su dung | 22/05/2026 |
| Cong cu AI | ChatGPT |
| Muc dich | Kiem tra Module 3 da dung huong du an chua |
| Phan viec lien quan | Backend, Frontend, Database |
| Muc do su dung | Ho tro nhieu |

**Prompt tom tat**

```text
Muon lam dung huong du an thi can gi? Kiem tra backend hien tai da co Task API chua va trien khai theo huong Backend giu layer-based, Frontend giu feature-based.
```

**Ket qua AI goi y**

AI kiem tra thay database migration da co cac bang `tasks`, `task_assignees`, `task_checklists`, nhung backend chua co Task entity/repository/service/controller. Frontend Kanban van dung mock data. Huong dung la them backend Task API va sua frontend de goi API that.

**Phan da ap dung**

- Them backend Task API theo cau truc layer-based.
- Them entity, dto, repository, service, controller cho Task.
- Them frontend `features/kanban/services/taskService.js`.
- Them `features/kanban/utils/taskMapper.js`.
- Sua Zustand store de fetch/create/update/delete task qua API.

### Lan 3 - Git, branch va convention team

| Noi dung | Thong tin |
|---|---|
| Ngay su dung | 22/05/2026 |
| Cong cu AI | ChatGPT |
| Muc dich | Kiem tra file truoc khi commit/push |
| Phan viec lien quan | Git, Project convention |
| Muc do su dung | Ho tro mot phan |

**Ket qua da ap dung**

- Doi branch thanh `feature/de190364-task-crud`.
- Kiem tra file nao can commit va file nao khong nen push.
- Them `.gitignore` cho file local/nham cho.
- Chuyen `service/taskService.js` thanh `services/taskService.js` de dong bo voi convention cac module khac.

### Lan 4 - Refactor static HTML sang React component va modular hoa UI

| Noi dung | Thong tin |
|---|---|
| Ngay su dung | 21/05/2026 |
| Cong cu AI | Antigravity |
| Muc dich | Chuyen file HTML tinh sang React va chia nhỏ component |
| Phan viec lien quan | Frontend, Refactor UI |
| Muc do su dung | Sinh chinh noi dung |

**Ket qua da ap dung**
- Trich xuat phan layout chinh tu các file HTML nhan duoc de tao thanh `KanbanBoardPage.jsx`, `TaskDetailPage.jsx`, `MyTasksPage.jsx`.
- Chia nho `KanbanBoardPage.jsx` thanh cac component con: `KanbanColumn.jsx`, `TaskCard.jsx`, `KanbanFilters.jsx`, `KanbanHeader.jsx`, `TaskDetailDrawer.jsx`, `TaskFormModal.jsx` theo dung blueprint features/kanban.
- Tao file upgrade plan `KANBAN_UPGRADE_PLAN.md` de theo doi cac nang cap giao dien trong tuong lai ma chua can viet logic phuc tap ngay lap tuc.

### Lan 5 - Cau hinh local database va debug loi bat dau backend

| Noi dung | Thong tin |
|---|---|
| Ngay su dung | 22/05/2026 |
| Cong cu AI | Antigravity |
| Muc dich | Thiet lap postgres local, xu ly Redis va start server |
| Phan viec lien quan | Backend, DevOps, Local Environment |
| Muc do su dung | Ho tro nhieu |

**Ket qua da ap dung**
- Tao file `application.yaml` chua thong tin ket noi Postgres local voi password `123`, giai thich cho nguoi dung hieu rang file nay da co trong `.gitignore` nen khong anh huong den project chung cua nhom.
- Giai thich nguyen nhan va huong dan nguoi dung chay terminal dung duong dan `cd code/frontend` thay vi go sai chinh ta `cd fronrend`.
- Ho tro phan tich va giai thich loi `Unable to connect to Redis` khi khoi chay backend vi chua bat Redis server local.

## 5. Bang tong hop muc do AI ho tro

| Hang muc | Khong dung AI | AI ho tro it | AI ho tro nhieu | AI sinh chinh | Ghi chu |
|---|:---:|:---:|:---:|:---:|---|
| Phan tich yeu cau Module 3 |  |  | x |  | Xac dinh pham vi Kanban |
| Thiet ke giao dien |  |  | x |  | Task Board, drawer, modal |
| Thiet ke backend API |  |  | x |  | Task API theo layer-based |
| Code frontend |  |  | x |  | Kanban store/components/pages |
| Code backend |  |  | x |  | Task entity/service/controller |
| Debug loi |  |  | x |  | Route, Redis, sidebar, panel state |
| Git workflow |  | x |  |  | Kiem tra branch va file can push |

## 6. Han che tu AI va cach xu ly

| STT | Han che | Cach phat hien | Cach xu ly |
|---:|---|---|---|
| 1 | Ban dau de file goi API trong folder `api`/`service`, chua dung convention team | So sanh voi module auth va requirement thay dang dung `services` | Doi thanh `features/kanban/services/taskService.js` |
| 2 | Can kiem tra lai file nao nen push | `git status` hien nhieu file local va generated file | Them/cap nhat `.gitignore`, chi add file lien quan Module 3 |
| 3 | Chua test duoc end-to-end vi database local chua co du lieu day du | Khi chuan bi test Task Board | Ghi chu can seed project/member/task de test sau |

## 7. Kiem chung ket qua AI

- Chay backend build bang Maven wrapper.
- Chay frontend build bang `npm run build`.
- Kiem tra `git status` de tranh push nham file local.
- So sanh cau truc folder voi convention hien co cua project.
- Kiem tra logic backend co check user la member cua project truoc khi thao tac task.

## 8. Dong gop ca nhan

Em phu trach Module 3 Task/Kanban Management. Cac phan da lam gom Task Board UI, drag/drop task, task drawer, full task detail, My Tasks, create/edit/delete task, assignee dropdown theo project member, backend Task API va ket noi frontend voi backend.

## 9. Reflection ngan

AI giup em nhin ro hon cach chia nho mot module full-stack thanh cac phan de lam: UI, store, service goi API, mapper du lieu, backend entity/service/controller. Em khong su dung ket qua AI mot cach nguyen ven ma co kiem tra lai theo cau truc san co cua du an va convention cua team.

## 10. Cam ket

Em cam ket noi dung tren phan anh dung qua trinh su dung AI trong khi lam Module 3. Cac ket qua AI duoc kiem tra, chinh sua va tich hop lai theo yeu cau cua du an.

---

## 11. Nhat ky bo sung - Task SLA, Daily Digest, Sprint/SLA Report va Event-driven SLA

Phan nay ghi bo sung cac phien lam viec sau Module 3, tap trung vao phan Task SLA, Daily Digest, Sprint/Weekly Report, Notification, Kafka event va SLA Decision Pack. Noi dung duoc chon loc tu cac thread lam viec trong Codex. Cac cau hoi ngoai le, fix bug nho, bai tap khac mon, loi dang nhap nho, loi pull code, hoac cac trao doi khong anh huong truc tiep den dong gop chinh khong duoc dua vao phan audit nay.

### Ngay 27/05/2026 - Tiep nhan va phan tich bai toan Task SLA / Daily Digest / Penalty

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Hieu ro phan viec moi ve task reminder, Daily Digest va SLA Penalty |
| Phan viec lien quan | Backend, Scheduler, Email, Database, Notification |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Em dua yeu cau F2.1, F2.2, F2.3 ve quan ly task va nhac nho thong minh vao AI de phan tich. Yeu cau ban dau bao gom: task phai co deadline, assignee, weight; he thong phai gom cac task can nhac vao Daily Digest; han che spam email; phan biet task sap den han, qua han ngan va qua han nang; tu dong penalty khi vi pham SLA.

**Ket qua AI ho tro**

- Giai thich lai nghiep vu Task SLA theo cach de hieu hon.
- De xuat tach van de thanh cac lop: rule danh gia SLA, scheduler, Daily Digest, email log, penalty log va notification.
- Huong dan khong nen gui email rieng le cho tung thay doi nho, ma nen gom vao Daily Digest de tranh spam.
- Giai thich vai tro cua Flyway migration va chi ra folder viet them DB:
  - `code/backend/src/main/resources/db/migration`
- Dinh huong tao tai lieu tong hop `task_sla_digest_weekly_report.md` de ghi lai phan SLA, Daily Digest va Weekly Report.

**Phan da ap dung**

- Bat dau xay dung huong Task SLA theo backend rule ro rang.
- Hinh thanh thiet ke Daily Digest gui email theo lich.
- Xac dinh can co scheduler quet task, tao digest, gui email va ghi log.
- Xac dinh can co penalty/audit log de minh bach viec tru diem hoac gan co vi pham.

**Phan em tu quyet dinh**

Em khong chon cach gui email realtime moi khi task thay doi, vi cach do de gay spam. Em chon huong Daily Digest va in-app notification de can bang giua viec nhac nho va trai nghiem nguoi dung.

### Ngay 28/05/2026 - Ra soat Task SLA, Daily Digest va Weekly Report

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Ra soat lai code va tai lieu phan Task SLA, Daily Digest, Weekly Report |
| Phan viec lien quan | Backend, Frontend report, Email, UI responsive |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Em yeu cau AI doc lai code va tap trung vao bao cao Task SLA, Daily Digest va Weekly Report. Trong qua trinh ra soat, em cung lam ro yeu cau UI mac dinh la tieng Anh, nhung khi Google Translate dich sang tieng Viet thi giao dien khong duoc vo layout.

**Ket qua AI ho tro**

- Ra soat cac thanh phan SLA/Digest/Report da co.
- Ghi nhan lai cac phan backend va frontend lien quan den report.
- Dieu chinh UI report ve tieng Anh mac dinh.
- Them cac xu ly layout nhu `min-w-0`, badge wrap, flex wrap de han che loi khi Google Translate lam chu dai hon.

**Phan da ap dung**

- Report UI giu ngon ngu mac dinh la English.
- Tang do ben layout khi dich tu dong.
- Cap nhat tai lieu `task_sla_digest_weekly_report.md` de ghi chu viec UI mac dinh la tieng Anh.

### Ngay 29/05/2026 - Thiet ke giao dien Report va bo sung Kafka realtime cho notification

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Nang cap Report UI va nghien cuu luong event/notification realtime |
| Phan viec lien quan | Sprint/Weekly Report, SLA flags, Scheduler panel, Kafka, WebSocket |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Em dua y tuong giao dien report gom 4 metric cards, member status panel, SLA flags, scheduler panel, weekly report tab va nut generate report. Sau do em tiep tuc trao doi ve viec bat Kafka that de push realtime notification tu cac event trong outbox.

**Ket qua AI ho tro**

- De xuat cau truc UI report de leader nhin nhanh tinh hinh sprint.
- Phan tich cac thanh phan nen co:
  - Metric cards.
  - Member risk/status.
  - SLA flags.
  - Scheduler/outbox panel.
  - Weekly/Sprint report summary.
- Ho tro them cau hinh Kafka trong backend.
- Tao `KafkaNotificationConsumer` lang nghe cac topic:
  - `devtrack.task.events`
  - `devtrack.notification.events`
  - `devtrack.sla.events`
  - `devtrack.email.commands`
- Dieu chinh Kafka publisher de gui envelope co `eventType` va `payload`.
- Giu WebSocket raw hien co, chi dung `NotificationWebSocketHandler.sendToUser(...)`.

**Phan da ap dung**

- Report UI duoc dinh huong theo dashboard quan ly tien do.
- Outbox/Kafka duoc xem nhu nen tang realtime cho notification.
- Scheduler publish outbox events van giu vai tro fallback/retry.

**Phan em tu quyet dinh**

Em giu raw WebSocket hien co, khong doi sang STOMP de tranh refactor lon va giu dung kien truc san co cua project.

### Ngay 30/05/2026 - Xac dinh lai nhiem vu va dong gop ca nhan trong project

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Xac dinh phan em phu trach va cach trinh bay dong gop |
| Phan viec lien quan | Task/Kanban, SLA, Report, Notification |
| Muc do su dung | Ho tro mot phan |

**Noi dung phien lam viec**

Em yeu cau AI doc so qua du an va nho lai phan nhiem vu cua em. Ngoai phan Task/Kanban ban dau, em bat dau mo rong phan dong gop sang Task SLA, Daily Digest, Sprint/Weekly Report va notification.

**Ket qua AI ho tro**

- Xac dinh cac nhom dong gop chinh cua em:
  - Task/Kanban Management.
  - Task SLA rule.
  - Daily Digest.
  - Weekly/Sprint Report.
  - Notification va outbox event.
- Phan biet phan code chinh, phan tai lieu, phan demo va phan can kiem chung.

**Ghi chu loc noi dung**

Trong cung thoi gian co mot so phien ve reset develop/pull code. Cac phien do chu yeu la thao tac Git/development environment nen khong dua vao audit chinh cua chuc nang.

### Ngay 01/06/2026 - Tim hieu cau truc du an, Git workflow va Scheduler

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Hieu cau truc FE/BE, quy dinh Git va y nghia scheduler |
| Phan viec lien quan | Project structure, Git, Backend scheduler |
| Muc do su dung | Ho tro mot phan |

**Noi dung phien lam viec**

Em hoi ve nen tang quan ly ma nguon, cau truc frontend/backend, quy dinh commit/branch va scheduler trong du an. Rieng phan scheduler duoc giai thich la thanh phan chay cac job tu dong theo lich, khong can nguoi dung bam nut.

**Ket qua AI ho tro**

- Giai thich frontend theo feature-based structure.
- Giai thich backend theo layer-based structure.
- Giai thich vai tro cua scheduler trong DevTrack AI:
  - Kiem tra task sap den han/tre han.
  - Tao digest.
  - Tao report.
  - Publish/retry outbox events.
- Giai thich scheduler la thanh phan quan trong cua SLA/Report vi cac tac vu nay phu thuoc thoi gian.

**Phan da ap dung**

Em nam duoc vi sao Task SLA va Daily Digest can scheduler thay vi chi xu ly khi user bam tren UI.

### Ngay 04/06/2026 - Hieu ro cron job, outbox event va du lieu Kanban column

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Giai thich cron job va xac dinh luong luu DB khi them cot Task Board |
| Phan viec lien quan | Scheduler, Outbox, Kanban columns |
| Muc do su dung | Ho tro mot phan |

**Noi dung phien lam viec**

Em hoi ve cac cron job nhu publish outbox events moi 30 giay va auto approve task dang review qua han. Em cung hoi khi them cot moi tren Task Board thi co tao trong database khong.

**Ket qua AI ho tro**

- Giai thich outbox publisher la co che xu ly event bat dong bo.
- Giai thich auto approve review task la job tu dong xu ly task bi tre trong trang thai review.
- Xac dinh khi them cot tren Task Board, frontend goi API `POST /api/v1/projects/{projectId}/kanban-columns` va backend luu vao bang `kanban_columns`.

**Phan da ap dung**

Em hieu ro hon moi lien he giua UI, DB va scheduler, dac biet la cac tac vu tu dong trong backend.

### Ngay 08/06/2026 - Tong hop dong gop Sprint Report, SLA va Notification

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Tong hop cac phan da lam de chuan bi bao cao/demonstration |
| Phan viec lien quan | Sprint Report, SLA, Email, Notification, WebSocket |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Em yeu cau AI doc lai project va xac dinh phan em da lam. Sau do em yeu cau ghi thanh mot file markdown trong folder `Tin`.

**Ket qua AI ho tro**

- Tao tai lieu `SPRINT_REPORT_SLA_NOTIFICATION_CONTRIBUTION.md`.
- Tong hop cac dong gop:
  - Chuyen Weekly Report thanh Sprint Report.
  - Ket noi Sprint Report voi API that.
  - Dong bo SLA tu backend toi UI.
  - Them notification realtime.
  - Them email report/digest.
  - Dieu huong khi click notification.

**Phan da ap dung**

Tai lieu nay duoc dung lam co so de em nhin lai pham vi dong gop va chuan bi noi dung demo.

### Ngay 10/06/2026 - Phat trien tu SLA reminder thanh Event-driven SLA Decision Support

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Nang cap SLA tu rule/reminder co ban thanh Event-driven SLA co state, log va decision pack |
| Phan viec lien quan | Kafka, Outbox, SLA state, Decision log, Daily Digest, Project Isolation |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em bat dau bang viec ra soat lai phan da lam va muon nang cap phan SLA de gay an tuong hon cho mon SWP. Trong qua trinh trao doi, em nhan ra neu SLA chi la vai dong if/else thi chua du thuyet phuc. AI ho tro em phan tich cac huong nang cap that su co gia tri.

**Huong nang cap duoc thao luan**

- Strategy Pattern de tach rule SLA.
- Event-driven re-evaluation bang Kafka.
- SLA Score thay vi chi co phat/khong phat.
- Decision Pack trong backend response.
- Daily Digest email co template dep hon.
- Reminder truoc deadline theo moc 3 ngay, 2 ngay, ngay mai, hom nay.
- Afternoon urgent reminder luc 17:00.
- Phan biet tre duoi 3 ngay la warning period, tu 3 ngay tro len moi penalty.

**Ket qua AI ho tro**

- Lam ro khac nhau giua Event-driven Reminder va full SLA State Engine.
- Thiet ke luong:

```text
Task/Evidence thay doi
-> Outbox event
-> Kafka
-> SlaEventConsumer
-> SlaStateService
-> task_sla_states
-> sla_decision_logs
-> Notification neu can
```

- Giai thich dung ten goi:
  - `Event-driven SLA re-evaluation`
  - `SLA read model`
  - `Decision log`
- Khong nen goi qua muc la full autonomous SLA engine khi penalty va scheduler van ton tai rieng.

**Phan da ap dung**

- Tao/ra soat `SlaEventConsumer`.
- Tao/ra soat `SlaStateService`.
- Them bang `task_sla_states`.
- Them bang `sla_decision_logs`.
- Publish event khi task/evidence thay doi.
- Them recheck event theo ngay va urgent recheck luc 17:00.
- Ghi tai lieu `SLA_EVENT_DRIVEN_COMPLETION.md`.

### Ngay 10/06/2026 - Project Isolation cho Daily Digest va SLA Reminder

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Dam bao moi project la mot workspace rieng |
| Phan viec lien quan | Daily Digest, Task query, Email, Project security |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Khi chay thu he thong nhac nho/email, em phat hien can dam bao moi project la mot moi truong doc lap. Neu mot user tham gia nhieu project, Daily Digest khong duoc tron task cua cac project khac nhau.

**Ket qua AI ho tro**

- Phan tich loi thiet ke neu Daily Digest chi theo user ma khong theo project.
- De xuat them `project_id` vao `daily_digests`.
- Tao unique key moi theo `user_id + project_id + digest_date + digest_type`.
- Them query `findSlaCandidatesByProjectId`.
- Them endpoint test trigger theo project:
  - `POST /api/v1/projects/{projectId}/digests/test-trigger`
- Cap nhat frontend de truyen `activeProject.id` khi bam nut chay thu he thong nhac nho.

**Phan da ap dung**

- Daily Digest duoc cach ly theo project.
- Email digest co hien thi ten project.
- Tai lieu `PROJECT_ISOLATED_DAILY_DIGEST.md` duoc tao de giai thich project isolation.

### Ngay 10/06/2026 - Dinh huong Level 5 va hanh trinh nang cap SLA

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Dinh vi muc do ky thuat cua SLA va huong toi Autonomous Project Manager |
| Phan viec lien quan | SLA Core, Decision Pack, Recovery Plan |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Em dat cau hoi ve viec phan SLA co the manh hon khong va "Level 5 - Autonomous Project Manager" co phai muc cao nhat khong. AI giai thich rang SLA hien tai nen duoc xem la Level 4 - Event-driven SLA Decision Support, con Level 5 can co Recovery Plan va Leader Approval.

**Ket qua AI ho tro**

- Dinh nghia cac level:
  - Level 1: Static SLA Rules.
  - Level 2: Scheduled Reminder/Daily Digest.
  - Level 3: Event-driven SLA Re-evaluation.
  - Level 4: SLA Decision Pack.
  - Level 5: Human-approved Autonomous Project Manager.
- Giai thich SLA khong phai dich cuoi, ma la bo cam bien rui ro.
- De xuat huong Level 5:
  - Detect risk.
  - Explain decision.
  - Generate recovery plan.
  - Leader approve.
  - Apply safe actions.
  - Audit log.

**Phan da ap dung**

- Tao tai lieu `SLA_LEVEL5_EVOLUTION_JOURNEY.md` trong folder `Tin`.
- Ghi lai hanh trinh tu reminder don gian den nen tang Autonomous Project Manager.

### Ngay 11/06/2026 - Hoan thien Full SLA Core: Action Log, Idempotency va Decision Pack UI

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Kiem tra va hoan thien Full SLA Core truoc khi dua AI/Recovery Plan vao |
| Phan viec lien quan | SlaActionLog, action_key, Decision Pack API/UI, compile verification |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em yeu cau lap ke hoach lam Full SLA Core truoc khi them AI. Sau do em yeu cau chia prompt thanh cac giai doan: gom luong quyet dinh SLA ve mot truc chinh, them action log/idempotency/project isolation, va them Decision Pack API/UI.

**Ket qua AI ho tro**

- Viet prompt refactor giai doan 1-4:
  - Chuan hoa `TaskSlaRuleService`.
  - `SlaStateService` la truc decision chinh.
  - Tao `SlaActionService`.
  - Dua penalty vao action workflow.
  - Daily/urgent recheck event.
- Viet lai prompt giai doan 5-6 sat voi code hien tai:
  - Tao `SlaActionLog`.
  - Them `action_key`.
  - Chong spam theo project/task/recipient/action/category/date.
  - Them repository query project-scoped.
- Kiem tra code sau khi implement:
  - `SlaActionLog`.
  - `SlaActionLogRepository`.
  - Migration `V20260610190000__add_sla_action_logs.sql`.
  - `SlaDecisionPackController`.
  - `SlaDecisionPackService`.
  - `SlaDecisionPackPanel.jsx`.
- Chay build:
  - Backend compile pass.
  - Frontend build pass.

**Sua loi quan trong**

AI phat hien duplicate check bang title co the lam he thong khong nhac lai vao ngay sau, vi title notification khong co ngay. Em yeu cau chinh lai. Ket qua la `SlaActionService` duoc sua de bo duplicate check bang title cho SLA assignee reminder, chi dung `action_key` lam co che chong spam chinh.

**Trang thai sau khi hoan thien**

```text
Cung project + cung task + cung assignee + cung action + cung category + cung ngay
-> khong gui lai

Khac ngay hoac khac category
-> duoc gui lai neu task van con rui ro
```

**Phan da ap dung**

- Full SLA Core co action log.
- Co idempotency key chong spam.
- Co Decision Pack API/UI.
- Co tai lieu `SLA_ACTION_LOG_AND_PROJECT_ISOLATION.md`.
- Build backend/frontend da duoc kiem chung.

### Ngay 12-13/06/2026 - Trien khai Recovery Plan backend flow theo Human-in-the-loop

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Nang cap SLA tu decision support sang recovery plan co leader approval |
| Phan viec lien quan | Backend, Database, Recovery Plan, Audit Log, Project Role |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Sau khi SLA Core da co state, decision log va action log, em tiep tuc hoi AI cach dua phan nay len muc cao hon. AI giai thich rang neu he thong chi canh bao thi moi dung o muc decision support; neu muon thanh Level 5 thi can co recovery plan, leader approval gate, execution an toan va audit trail.

**Ket qua AI ho tro**

- De xuat luong Human-in-the-loop:

```text
SLA risk detected
-> generate recovery plan
-> leader/mentor approve or reject
-> execute safe actions
-> write audit log
```

- Giai thich vi sao khong nen cho AI tu sua task truc tiep.
- De xuat cac bang va entity can co:
  - `recovery_plans`
  - `recovery_plan_actions`
  - `recovery_plan_audit_logs`
- De xuat unique index active recovery plan de tranh tao nhieu plan dang active cho cung mot task.
- Dinh nghia cac trang thai:
  - `PENDING_APPROVAL`
  - `APPROVED`
  - `REJECTED`
  - `EXECUTING`
  - `EXECUTED`
  - `FAILED`

**Phan da ap dung**

- Tao backend flow cho Recovery Plan:
  - Generate plan.
  - Approve/reject plan.
  - Execute safe actions.
  - Lay audit logs.
- Them action execution an toan:
  - Notify assignee.
  - Request evidence.
  - Ask blocker update.
  - Create recovery checklist.
  - Escalate leader.
- Them audit log cho tung buoc generate/approve/reject/execute/action.
- Them partial unique index `uk_active_recovery_plan_per_task` de chong race khi tao plan active.
- Ghi tai lieu `Tin/recovery_plan_backend_flow_changes.md`.

**Phan em tu quyet dinh**

Em giu co che leader/mentor approval, khong cho AI hay scheduler tu dong thay doi task mot cach khong kiem soat. Nhung action nao co rui ro cao hoac can con nguoi can thiep thi chi tao recommendation/log, khong execute tuy tien.

### Ngay 13/06/2026 - Dinh huong dua AI vao Recovery Plan mot cach mem hon

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Tim cach dung AI trong Recovery Plan nhung van giu rule backend an toan |
| Phan viec lien quan | AI prompt, Recovery Plan, Notification tone, Human approval |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Em hoi AI co nen dua AI vao Recovery Plan khong, vi flow rule-based da chay duoc nhung message va summary con cung, de tao cam giac he thong "ra lenh" hon la ho tro team.

**Ket qua AI ho tro**

- De xuat AI chi nen ho tro sinh noi dung theo context, khong duoc nam quyen thay doi du lieu.
- De xuat tone nhu Agile Coach/Scrum Master:
  - ro nguyen nhan risk,
  - nhe nhang voi assignee,
  - dua huong hanh dong cu the,
  - tranh cam giac bi phat.
- Phan biet:
  - backend rule quyet dinh risk/action an toan,
  - AI sinh summary/action message de giai thich tot hon,
  - leader van la nguoi approve.

**Phan da ap dung**

- Tao tai lieu `Tin/SLA_LEVEL5_AI_RECOVERY_IDEA.md`.
- Dung y tuong nay lam nen cho buoc Adaptive AI Recovery sau do.

### Ngay 18/06/2026 - Adaptive AI Recovery Loop va Hybrid Rule-based Scoring

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Nang cap recovery plan va scoring de co kha nang du bao/phan hoi tot hon |
| Phan viec lien quan | SLA Scoring, AI Recovery, Follow-up Plan, Test |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em tiep tuc muon phan SLA khong chi canh bao ma con co kha nang de xuat hanh dong phu hop va theo doi hieu qua sau khi execute. AI giup em tach ro phan nao la deterministic rule va phan nao la AI support.

**Ket qua AI ho tro**

- De xuat AI action selection nhung phai bi gioi han boi whitelist.
- Neu Gemini tra action sai hoac thieu, backend fallback ve rule-based action cu.
- De xuat follow-up loop:

```text
Plan EXECUTED
-> scheduler check after 24h
-> compare score before/after
-> if ineffective, mark declined and generate follow-up plan
```

- De xuat Hybrid Rule-based SLA Scoring:
  - deadline penalty,
  - burn rate penalty,
  - evidence penalty,
  - blocker penalty,
  - workload penalty.
- Giai thich khong nen goi la AI prediction that neu chua co model hoc tu lich su; ten dung hon la Rule-based Early Risk Prediction / Predictive SLA Risk.

**Phan da ap dung**

- Gemini co the tra `selectedActions`, backend validate theo whitelist.
- Them adaptive follow-up recovery plan khi plan khong cai thien sau execution.
- Them guard an toan:
  - khong tao follow-up neu dang co active plan,
  - khong tao qua nhieu follow-up trong 24h,
  - gioi han so AI plan trong cung sprint.
- Refactor scoring sang hybrid score co burn rate, SPI, predicted risk va score breakdown.
- Cap nhat Decision Pack API/UI de hien them burn rate, predicted risk, prediction reasons va score breakdown.
- Them tai lieu `Tin/SLA_ADAPTIVE_AI_AND_HYBRID_SCORING_20260618.md`.

**Kiem chung**

Da ghi nhan cac lenh verify trong tai lieu local:

```text
mvnw compile
mvnw test-compile
mvnw test voi nhom SLA service tests
mvnw test BackendApplicationTests
```

Ket qua duoc ghi nhan la pass, co warning Mongo local chua bat nhung khong lam test fail.

### Ngay 19/06/2026 - Reliability Monitoring, Evidence Snapshot va Recovery Gate Result

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | Codex |
| Muc dich | Lay code moi nhat, kiem tra prompt SLA, fix duplicate job va hoan thien evidence/gate |
| Phan viec lien quan | Backend, Frontend, Flyway, Reliability, Recovery Plan |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em yeu cau AI lay code moi nhat tu `develop`, doc code that sau khi co prompt moi, kiem tra phan nao da xong/chua xong va sua cac loi can thiet. Cac prompt chinh lien quan den Scheduler Logs UI, Async SLA Analysis Job, Recovery Plan Dashboard, Evidence Snapshot va Gate Result.

**Ket qua AI ho tro**

- Pull/merge code moi nhat tu `origin/develop` vao branch hien tai.
- Kiem tra code that thay phan SLA reliability/recovery da gan xong nhung con mot so rui ro duplicate/race condition.
- Giai thich cac khai niem hoc tu phan cua thanh vien khac:
  - idempotency,
  - DB constraint,
  - row lock,
  - distributed lock/Redis.
- Ket luan khong can them Redis lock ngay; voi code hien tai nen dung DB unique index va row lock truoc.

**Phan da ap dung**

- Them SLA Reliability Monitoring:
  - reliability snapshot theo project/sprint,
  - MTTR, MTBF, Availability, Error Budget,
  - Gemini narrative,
  - async analysis job,
  - reliability dashboard,
  - scheduler logs page.
- Fix duplicate SLA analysis job:
  - neu da co job `PENDING/RUNNING` cung project/sprint thi tra job cu,
  - DB unique partial index cho active job,
  - catch duplicate race va tra job dang chay.
- Them Evidence Snapshot cho Recovery Plan:
  - luu `evidenceSnapshotId`,
  - compute reliability snapshot sau effectiveness check,
  - UI hien link sang reliability khi co evidence.
- Them Gate Result:
  - `PASSED`,
  - `FAILED`,
  - `INSUFFICIENT_DATA`,
  - `gateReason`,
  - UI hien score before -> after va ly do.
- Them row lock cho approve/reject/execute recovery plan bang `PESSIMISTIC_WRITE`.
- Fix Flyway migration idempotent de backend local khong tu dung vi duplicate table/column.

**Commit lien quan**

- `8d690a8` - merge `origin/develop` vao branch `feature/de190364-adaptive-sla-recovery`.
- `8db5058` - `[DE190364] feat: add SLA reliability monitoring`.
- `f5ec7f6` - `[DE190364] feat: add recovery plan evidence gate`.
- `ae2dfc1` - `[DE190364] fix: make migrations idempotent`.

**Kiem chung**

```text
mvnw.cmd -DskipTests compile
```

Ket qua: backend compile pass.

Ghi chu: `clean compile` bi fail do file jar trong `target` dang bi process backend giu, kha nang backend dang chay tu IntelliJ/VSCode, khong phai loi compile code.

**Noi dung da loc bo khoi audit**

Khong dua chi tiet cac cau hoi nho nhu VSCode/IntelliJ chiem backend, hoi giai thich ngan ve file agent, hay cac trao doi ve viec anh GitHub hien so dong code. Cac noi dung do chi ho tro hieu context, khong phai thay doi chuc nang chinh.

### Cac noi dung da loc bo, khong dua vao audit chinh

Nhung phien sau khong duoc ghi chi tiet vao AI Audit Log vi khong phai dong gop chinh cho module hoac chi la ho tro nho:

- Bai assignment Car Rental ngoai project DevTrack AI.
- Loi dang nhap nho, loi chay backend/pull code neu chi la thao tac moi truong.
- Hoi ve xung dot khi mo nhieu thread cung luc.
- Cac cau hoi nho ve UI nhu them thanh cuon ngang, keo cot bi loi, neu khong tao thay doi kien truc quan trong.
- Cac cau hoi ngoai le hoac chi de hieu thao tac co ban, khong anh huong truc tiep den SLA/Report/Task module.

## 12. Tong ket bo sung

Sau cac phien lam viec bo sung, phan dong gop cua em khong chi dung lai o Module 3 Task/Kanban. No mo rong thanh mot cum chuc nang quan trong cua DevTrack AI:

- Quan ly task va deadline.
- SLA rule va penalty.
- Daily Digest chong spam email.
- Weekly/Sprint Report cho leader/mentor.
- Notification realtime.
- Outbox/Kafka event.
- Event-driven SLA re-evaluation.
- Project-isolated Daily Digest.
- SLA Decision Pack.
- SLA Action Log va idempotency key.
- Human-in-the-loop Recovery Plan.
- Adaptive AI Recovery Loop.
- Hybrid Rule-based SLA Scoring va burn rate prediction.
- SLA Reliability Monitoring.
- Evidence Snapshot cho Recovery Plan.
- Recovery Gate Result.
- DB constraint va row lock de chong duplicate/race condition.

AI duoc su dung de phan tich, thiet ke huong lam, tao prompt trien khai, ra soat code va giai thich loi. Em khong ap dung may moc ma da lien tuc hoi lai, so sanh voi code hien co, yeu cau compile/build, va chi giu lai nhung huong phu hop voi project.
