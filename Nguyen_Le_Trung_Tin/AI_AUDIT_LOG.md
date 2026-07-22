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

### Ngay 25/06/2026 - Nang cap Outbox Pattern va Admin Job Dashboard

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | Antigravity |
| Muc dich | Nang cap Outbox Pattern len chuan production, xu ly Idempotency, Graceful Shutdown, DLQ va xay dung Admin Job Dashboard |
| Phan viec lien quan | Backend, Database, React Frontend, Unit Test |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em yeu cau AI nang cap Outbox Pattern tu trang thai co ban (status PENDING/PUBLISHED/DEAD) thanh he thong ben bi hon de chuan bi cho production. Yeu cau chi tiet gom: them Idempotency Key, Graceful Shutdown, Dead Letter Queue (DLQ), cron job don dep processed events, xay dung Admin REST APIs, va UI bang React.

**Ket qua AI ho tro**

- Tao Flyway script cap nhat Database (them bang `dead_letter_events`, `processed_events`, cot `idempotency_key`).
- Hoan thien logic tao va check Idempotency Key bang hash (SHA-256) de chong trung lap event, xu ly an toan voi `DataIntegrityViolationException`.
- Tich hop `SmartLifecycle` de dam bao OutboxPublisherService Graceful Shutdown (doi 25s cho batch chay xong).
- Xay dung luong xu ly Dead Letter Queue (DLQ): Luu tru event loi, giu nguyen so lan retry khi admin kich hoat lai va gui email canh bao thong qua `EmailService`.
- Tao cron job don dep `processed_events` qua 7 ngay tuoi.
- Xay dung he thong 4 REST APIs cho phia Admin de thong ke, xem danh sach DLQ, xem lich su Scheduler va API chay lai (Retry) su kien loi.
- Code trang `JobDashboardPage.jsx` cho System Admin theo doi thong ke, bang log va thao tac Retry truc tiep bang giao dien.
- Viet test case `OutboxEventServiceTest.java` dung JUnit 5 va Mockito.

**Phan da ap dung**

- Full stack luong xu ly event production-ready tu Database cho toi React UI.
- Giao dien giam sat an toan, bao gom chuc nang quan tri cho phep phuc hoi he thong khi co su co kien truc mang.

### Lan 34 - Custom System Health Checks and Monitoring

| Noi dung | Thong tin |
|---|---|
| Ngay su dung | 25/06/2026 |
| Cong cu AI | Antigravity |
| Muc dich | Trien khai he thong System Health Checks va Job Monitoring khong dung Actuator |
| Phan viec lien quan | Backend, Database, React Frontend, Unit Test |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em yeu cau AI xay dung he thong giam sat chu dong tu custom code (khong phu thuoc vao Actuator), giup nguoi quan tri de dang theo doi suc khoe cua database, disk, memory va lich trinh cac job quan trong tu Admin UI. Yeu cau chi tiet gom: Flyway migration, Entity, Repository, Monitoring Executor, @MonitoredJob annotation, MonitoringAspect, HealthCheckService, AlertService qua email, System Monitor Scheduler, DTOs, Admin REST API, va React Frontend update cho trang JobDashboardPage.

**Ket qua AI ho tro**

- Tao Flyway script cap nhat Database (them bang `system_health_checks`, `monitored_job_stats`).
- Xay dung AOP Aspect (`@MonitoredJob`) de tu dong bat cac loi cua job va tracking `consecutiveFailures`.
- Them `HealthCheckService` de kiem tra Database, Disk, va Memory.
- Them `MonitoringAlertService` de gui email canh bao khi health check that bai hoac job that bai lien tuc.
- Them `SystemMonitorScheduler` chay dinh ky (5 phut/lan) de update health status.
- Mo rong `AdminJobDashboardController` voi 3 API quan ly Health Summary, Live Health Check va Job Stats.
- Cap nhat React Frontend `JobDashboardPage.jsx`, them section "System Health & Monitoring".
- Viet test case `HealthCheckServiceTest.java` va `MonitoringAspectTest.java` dung JUnit 5 va Mockito.

**Phan da ap dung**

- Kien truc giam sat (Monitoring) su dung custom solution toi uu thay cho actuator.
- Dashboard UI/UX cap nhat giao dien muot ma, auto-refresh cho Admin.

### Ngay 25/06/2026 - Xay dung nen tang AI Training va mo rong Audit Scope

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Chuan bi du lieu training cho ML model: them prediction confidence, backfill accuracy va tao DB view tong hop feature |
| Phan viec lien quan | Backend, Database, SLA, Audit |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Em nhan ra de ML model co the hoc tu lich su, can phai luu them truong `predictionConfidence` vao trang thai SLA va can co co che kiem tra xem du doan co chinh xac hay khong khi sprint ket thuc. Em hoi AI ve cach tinh prediction confidence tu khoang cach diem so den ranh gioi cua zone rui ro, va cach backfill truong `predictionAccurate` tu lich su sprint.

**Ket qua AI ho tro**

- Giai thich cach tinh confidence tu khoang cach score den ranh gioi zone (zone boundary distance).
- De xuat them `predictionConfidence` vao `AssessmentResult` va luu vao `task_sla_states`.
- Huong dan them buoc backfill trong `DataSyncScheduler`: khi sprint tu dong hoan thanh, so sanh `predictedRiskLevel` voi ket qua task thuc te de tinh `predictionAccurate`.
- De xuat them `projectId` vao `AuditLog` bang cach extract tu request URI (regex pattern `/projects/(\d+)`).
- Goi y tao DB view `v_member_ai_features` join `weekly_report_members` voi `task_sla_states` de cung cap feature vector san cho viec train model.

**Phan da ap dung**

- Them `predictionConfidence` vao `SlaRiskAssessmentService` va `SlaStateService`.
- Them buoc backfill `predictionAccurate` trong `DataSyncScheduler`.
- Them `projectId` vao `AuditLog`, extract tu URI trong `AuditService`.
- Tao migration `V20260630000000` voi `ALTER TABLE audit_logs ADD project_id` va `CREATE VIEW v_member_ai_features`.

**Phan em tu quyet dinh**

Em quyet dinh khong luu confidence neu khong du du lieu (task moi tao chua co lich su), tra ve null thay vi 0 de phan biet voi truong hop du bao that su thap.

### Ngay 26/06/2026 - Trien khai AI Sprint Completion Summary va nang cap danh gia thanh vien

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Them AI tu dong sinh bao cao tong ket sprint va nang cap danh gia thanh vien thanh 4 phan ro rang |
| Phan viec lien quan | Backend, Frontend, Sprint, SLA |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em muon khi sprint ket thuc, he thong tu dong sinh mot bao cao tong ket bang Gemini thay vi de leader tu nhan xet tay. Ngoai ra phan danh gia thanh vien trong `SlaPingService` van tra ve doan text thang, kho phan biet cac phan y kien. Em hoi AI cach cau truc Gemini prompt de sinh bao cao co chieu sau va bao cao danh gia thanh vien co nhieu goc nhin.

**Ket qua AI ho tro**

- De xuat cau truc sprint narrative theo 6 tieu chi: Goal Achievement, Delivery, Quality, Teamwork, Process, Improvement Areas.
- De xuat trigger `generate()` trong `SprintServiceImpl.updateSprintStatus()` khi trang thai chuyen sang COMPLETED, chi generate mot lan.
- Them `DataSyncScheduler` backfill cho cac sprint da COMPLETED truoc do chua co summary.
- De xuat cau truc 4-section cho member AI evaluation: Performance Summary, Strengths, Areas for Improvement, Potential Risks.
- De xuat frontend render tung section thanh card mau sac rieng de de doc.

**Phan da ap dung**

- Tao `SprintCompletionSummary` entity, repository, `SprintCompletionService`, migration `V20260627000001`.
- Tao `GeminiSprintNarrativeService` sinh sprint narrative theo 6 tieu chi.
- Tao `GeminiMemberNarrativeService` sinh member evaluation theo 4-section format.
- Cap nhat `SlaPingService` su dung format moi.
- Frontend `SprintHealthModal` render section cards co mau sac.
- `ReliabilityDashboardPage` doi Gemini narrative hien thi tren metric charts.

**Phan em tu quyet dinh**

Em giu che do "edit-before-ping": leader doc lai AI draft truoc khi thuc su gui thong bao den assignee. Khong cho AI tu dong gui thong bao ma khong qua review.

### Ngay 28/06/2026 (phien sang) - Nang cap danh gia thanh vien 5 tieu chi va WebSocket realtime

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Danh gia thanh vien sau sprint chinh xac hon voi 5 tieu chi do luong, them WebSocket de frontend tu cap nhat khi AI xong |
| Phan viec lien quan | Backend, Frontend, Sprint, WebSocket |
| Muc do su dung | Ho tro nhieu |

**Noi dung phien lam viec**

Em phat hien bao cao sprint hien tai chua phan biet ro cac khia canh danh gia thanh vien: nguoi giao nhieu task chua chac tot hon nguoi giao it nhung hoan thanh som. Em hoi AI ve cach dinh nghia 5 tieu chi do luong khach quan va cach khong de frontend phai hardcode 60s delay khi cho AI generate xong.

**Ket qua AI ho tro**

- De xuat 5 tieu chi: delivery reliability (ti le hoan thanh dung han), task weight (tong trong so task), proactiveness (so ngay trung binh hoan thanh som hay tre), priority handling (xu ly task Priority cao/urgent), workload volume (so luong task).
- De xuat Gemini prompt ngan gon: 2 cau, toi da 35 tu, goi ten thanh vien truc tiep, tranh ngon ngu chung chung.
- De xuat them WebSocket broadcast `broadcastSprintAiDone` sau khi Gemini generate xong thay vi hardcode wait 60s.
- De xuat collapse/expand comment AI mac dinh de giam chieu dai trang.

**Phan da ap dung**

- Cap nhat `SprintCompletionService` tinh 5 tieu chi truoc khi goi Gemini.
- Cap nhat `GeminiMemberNarrativeService` voi prompt ngan gon, ro ten, ro tieu chi.
- Them `broadcastSprintAiDone` trong `WebSocketBroadcastService`.
- Frontend `SprintReportPage` lang nghe WebSocket thay vi waiting countdown.
- `SprintReportResult` collapse/expand AI comment theo tung thanh vien.

### Ngay 28/06/2026 (phien chieu) - Quy trinh dong project, quality score va xuat bao cao Excel

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Xay dung quy trinh dong project hoan chinh: kiem tra truoc khi dong, tinh diem dong gop, khoa chinh sua va xuat Excel 3 sheet |
| Phan viec lien quan | Backend, Frontend, Database, Excel Export |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em nhan thay du an chua co co che chinh thuc de ket thuc mot project. Leader hien khong the dong project sau khi sprint ket, cac task/bug van con mo, va khong co bao cao tong hop dong gop de nop. Em hoi AI ve cach thiet ke luong dong project an toan, tinh Quality Score khach quan cho tung task, va xuat Excel co the dung lam bang cham diem.

**Ket qua AI ho tro**

- De xuat pre-close check: kiem tra task chua DONE, bug chua closed, sprint chua COMPLETED truoc khi cho dong.
- De xuat 2 option xu ly task con do: CANCEL_ALL hoac MOVE_TO_PROJECT (chuyen sang project moi).
- De xuat Quality Score (1-10) theo cong thuc: deadline penalty graduated va SLA penalty.
- De xuat Task Points = Weight x Priority Factor x (Quality/10) de tinh ti le dong gop tuong doi.
- De xuat Excel 3 sheet: Tasks (theo sprint/thanh vien), Member Summary (tong diem), Formula Sheet (cong thuc kiem tra).
- De xuat `ProjectClosureModal` la wizard 4 buoc: kiem tra → xu ly task → ly do → xac nhan.
- De xuat ma task tuan tu theo project: TSK-001, TSK-002.

**Phan da ap dung**

- Them trang thai ARCHIVED cho Project, khoa toan bo CRUD khi ARCHIVED.
- Them reopen (ARCHIVED → ACTIVE) voi ly do ghi vao AuditLog.
- Them auto-track `actualHours` va `qualityScore` khi task → DONE.
- Them auto-assign ma task `TSK-NNN` khi tao task.
- Tao `ProjectTrackingExportService` xuat Excel 3 sheet.
- Them `ProjectClosureModal.jsx` la wizard 4 buoc.
- Them nut Export Tracking / Close Project / Reopen tren `DashboardPage`.
- Them BugReport lock khi project ARCHIVED.
- Them real-time SYSTEM notification den tat ca thanh vien khi project dong.
- Them `PROJECT_CLOSED` outbox event.
- Migration `V20260628000002__project_closure_and_task_tracking.sql`.

**Kiem chung**

```text
Backend compile: pass
Frontend build: pass
```

**Phan em tu quyet dinh**

Em quyet dinh tinh Quality Score hoan toan rule-based, khong dung AI, de dam bao moi thanh vien co the hieu va kiem tra cong thuc. AI chi duoc dung o phan giai thich, con diem so phai tu giai thich duoc bang rule.

### Ngay 29/06/2026 (phien 1) - Xay dung FastAPI ML Microservice du bao rui ro SLA

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Tach ML model ra microservice rieng, khong embed vao Spring Boot, de co the train va deploy doc lap |
| Phan viec lien quan | ML, Backend, Docker, FastAPI, Python |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em muon phan du doan SLA risk khong chi dua vao rule co dinh ma dua vao model duoc train tu lich su du an. Em hoi AI ve huong kien truc phu hop: nen embed model vao Spring Boot hay tach ra microservice rieng.

**Ket qua AI ho tro**

- Giai thich nen tach ra FastAPI microservice (port 8001) vi Spring Boot khong native voi PyTorch, va microservice co the train/deploy doc lap.
- De xuat PyTorch multi-task model voi 37 features: deadline gap, burn rate, evidence count, blocker status, workload volume.
- De xuat 3 output dau ra: risk level (HEALTHY/ON_TRACK/AT_RISK/WARNING/BREACH), penalty probability (0-1), recovery priority (LOW/MEDIUM/HIGH).
- De xuat cach tich hop trong Spring Boot: `MlFeatureBuilder` chuan bi vector, `MlServiceClient` goi HTTP, fallback ve rule-based neu ML service down.
- De xuat Dockerfile va docker-compose service cho ml-service.
- Goi y doi ten risk levels cho co y nghia hon: NORMAL→HEALTHY, HIGH→WARNING, CRITICAL→BREACH.

**Phan da ap dung**

- Tao thu muc `ml-service/` voi FastAPI, PyTorch, joblib.
- Tao `MultiTaskSLAModel` (37 input features, 3 output heads): risk classification (86.5% accuracy), penalty regression, recovery priority.
- Tao endpoint `/predict/sla-risk`, `/predict/sprint-health`, `/detect/anomaly`.
- Tao `MlFeatureBuilder.java` va `MlServiceClient.java` trong Spring Boot.
- Doi ten SLA risk levels, them migration `V20260628000002` de rename du lieu cu.
- Them Dockerfile va docker-compose cho ml-service.
- Them alert cooldown 1 gio trong `SystemMonitorScheduler` de chong spam email.

**Phan em tu quyet dinh**

Em them fallback trong `MlServiceClient`: neu FastAPI khong tra loi trong 3s thi dung ket qua rule-based cu thay vi de loi. He thong van hoat dong binh thuong khi ML service chua bat.

### Ngay 29/06/2026 (phien 2) - RAG context injection va RLHF feedback loop cho Recovery Plan

| Noi dung | Thong tin |
|---|---|
| Cong cu AI | ChatGPT / Codex |
| Muc dich | Nang cap chat luong Gemini recovery plan bang cach inject context tu cac plan cu hieu qua, va day mo hinh hoc tu phan hoi cua leader |
| Phan viec lien quan | ML, FastAPI, Backend, RAG, RLHF |
| Muc do su dung | Ho tro rat nhieu |

**Noi dung phien lam viec**

Em nhan xet rang Gemini dang sinh recovery plan theo prompt thuan tuy, khong biet cac plan nao da tung hieu qua trong qua khu. Em hoi AI ve cach dung RAG de inject context tu plan cu vao Gemini prompt, va cach thu thap phan hoi tu leader de cai thien index theo thoi gian.

**Ket qua AI ho tro**

- Giai thich RAG (Retrieval-Augmented Generation): embed plan cu vao FAISS vector store, khi generate plan moi thi tim top-3 plan tuong tu nhat va them vao Gemini prompt.
- De xuat sentence-transformers `all-MiniLM-L6-v2` (384-dim) de embed plan text.
- Giai thich RLHF signal tu cac hanh dong cua leader: APPROVE/REJECT plan → STRONG/WEAK POSITIVE/NEGATIVE.
- De xuat luong tu dong rebuild FAISS: collect signal → buffer >= 50 strong signals → trigger background rebuild.
- Canh bao ve van de Unicode path tren Windows voi `faiss.write_index` → giai phap: dung `serialize_index` ra bytes + joblib bundle.

**Phan da ap dung**

- Tao `ml-service/app/rag/`: `embedder.py`, `faiss_store.py`, `build_index.py`.
- Tao endpoint `/recovery/similar` tim top-k plan tuong tu.
- Tao endpoint `/recovery/generate-plan` de FastAPI ML Service lam gateway chinh cho Recovery Plan generation: nhan context tu Spring Boot `MlServiceClient`, inject RAG context, roi goi Ollama/Gemini.
- Tao endpoint `/feedback/signal` nhan RLHF signal tu Spring Boot.
- Tao endpoint `/train/trigger` va `/train/status` quan ly viec rebuild FAISS.
- Ghi ro `GeminiRecoveryService.generateWithRagContext()` chi con la legacy/deprecated direct-Gemini path, khong phai flow chinh.
- Hook RLHF signal vao `RecoveryPlanService`: approve/reject/gate_result deu gui signal.
- Fix FAISS Unicode path issue tren Windows bang `serialize_index` bytes + joblib.

**Phan em tu quyet dinh**

Em dat nguong `MIN_SIGNALS = 50` cho RLHF rebuild va chi lay `STRONG_POSITIVE` signals co `improvement >= 15`. Em khong rebuild tu dong theo schedule ma chi rebuild khi du signals de tranh model drift tu noise.

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
- Xay dung Admin Job Dashboard.
- Co che Data Synchronization va WebSocket Realtime.
- Xay dung Custom System Health Checks and Monitoring.
- Nen tang AI Training: prediction confidence, predictionAccurate backfill, DB view v_member_ai_features.
- AI Sprint Completion Summary theo 6 tieu chi va Member Evaluation 4-section.
- Danh gia thanh vien 5 tieu chi do luong va WebSocket realtime AI done signal.
- Quy trinh dong project: ARCHIVED lock, Quality Score, ma task TSK-NNN, Excel 3 sheet, wizard 4 buoc.
- FastAPI ML Microservice: PyTorch multi-task, 37 features, 86.5% accuracy, Dockerfile.
- RAG context injection vao Gemini Recovery Plan bang FAISS + sentence-transformers.
- RLHF feedback loop: leader action → signal → auto-rebuild FAISS index.

AI duoc su dung de phan tich, thiet ke huong lam, tao prompt trien khai, ra soat code va giai thich loi. Em khong ap dung may moc ma da lien tuc hoi lai, so sanh voi code hien co, yeu cau compile/build, va chi giu lai nhung huong phu hop voi project.
