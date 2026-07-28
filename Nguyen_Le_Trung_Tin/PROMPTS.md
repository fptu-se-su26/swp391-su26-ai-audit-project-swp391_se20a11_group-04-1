# Prompt Log - Nguyen Le Trung Tin

## 1. Thong tin chung

| Thong tin | Noi dung |
|---|---|
| Mon hoc | SWP391 |
| Project | DevTrack AI |
| Sinh vien | Nguyen Le Trung Tin |
| MSSV | DE190364 |
| Module | Module 3 - Task/Kanban Management |
| Cong cu AI | ChatGPT |
| Thoi gian | 21/05/2026 - 22/05/2026 |

## 2. Cac prompt quan trong da su dung

### Prompt 1 - Phan tich huong lam Module 3

```text
Ban dong vai tro nhu mot senior full-stack developer co kinh nghiem voi React, Zustand, Spring Boot va PostgreSQL. Toi dang lam Module 3 Task/Kanban cho du an DevTrack AI mon SWP391. Project hien co frontend React/Vite, backend Spring Boot, PostgreSQL va frontend dang to chuc theo features. Toi chua chac nen bat dau tu Kanban UI, store, task drawer/modal hay backend API truoc. Hay doc cau truc du an hien tai, phan tich huong trien khai Module 3 sao cho phu hop, roi de xuat thu tu lam viec ro rang. Toi muon cau tra loi bang tieng Viet, co phan danh gia tinh trang hien tai, cau truc folder nen dung, cac buoc trien khai uu tien va rui ro can tranh khi push code cho team. Vi du neu frontend dang dung feature-based thi nen dat code trong `features/kanban`, con backend dang dung layer-based thi nen them Task vao `controller`, `dto`, `entity`, `repository`, `service`.
```

**Ket qua su dung:** Dung de xac dinh pham vi Module 3 va thu tu uu tien: Kanban UI, store, drawer/modal, full detail, sau do ket noi backend.

### Prompt 2 - Refactor Kanban UI

```text
Ban hay xem nhu toi dang nho mot frontend engineer review va refactor Task Board. Toi co trang Kanban trong DevTrack AI voi cac cot Todo, In Progress, In Review, Done va Blocked. Toi muon tach code sach hon de de doc, de mo rong va dung cau truc `features/kanban`. Hay de xuat cach tach thanh store va components nhu KanbanHeader, KanbanFilters, KanbanColumn, TaskCard, TaskDetailDrawer, TaskFormModal. Store can quan ly danh sach task, task dang chon, trang thai mo drawer/modal, tao task, sua task, xoa task va doi status. Tra loi bang tieng Viet, giai thich vai tro tung component, state/action can co va luong hoat dong khi click task hoac bam New Task.
```

**Ket qua su dung:** Dung de tach Task Board thanh nhieu component nho, tao store rieng va giam viec viet tat ca logic trong mot page.

### Prompt 3 - Keo tha task giua cac cot

```text
Toi muon them keo tha task giua cac cot trong Kanban bang React. Ban hay giai thich nhu mot frontend developer co kinh nghiem xu ly drag-and-drop. Hien task co status nhu TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED. Khi keo task sang cot khac thi status phai cap nhat theo cot moi. Toi muon dung cach don gian, de hieu, chua can them thu vien neu khong can thiet. Hay giai thich nguyen ly drag/drop, cac event can dung, state can quan ly, cach goi action update status va cach tranh loi UX nhu click task bi nham voi thao tac drag. Vi du keo TASK-12 tu IN_PROGRESS sang DONE thi goi `updateTaskStatus('TASK-12', 'DONE')`.
```

**Ket qua su dung:** Dung de them HTML5 drag/drop cho TaskCard va KanbanColumn.

### Prompt 4 - Task drawer va full detail

```text
Toi dang thiet ke phan xem chi tiet task cho Module 3. Ban hay dong vai mot frontend engineer co tu duy san pham. Trong Task Board, khi click vao task thi toi muon mo panel/drawer ben phai de xem nhanh thong tin. Ngoai ra toi cung muon co mot trang full detail rieng cho task. Hay giup toi phan tich drawer dung de lam gi, full detail page dung de lam gi, hai phan nay nen giong va khac nhau o dau. Toi can co nut Open full detail trong drawer va mot nut mui ten o trang full detail de thu gon lai ve panel. Hay de xuat luong dieu huong phu hop, vi du tu drawer di den `/kanban/tasks/{taskId}`, con tu full detail quay ve `/kanban` va mo lai panel cua dung task.
```

**Ket qua su dung:** Dung de them luong Open full detail va Collapse to panel.

### Prompt 5 - Kiem tra dung huong du an

```text
Toi da lam duoc UI Kanban nhung chua chac da dung huong du an vi du lieu task ban dau van la mock/local state. Ban hay dong vai technical lead va kiem tra giup toi. Du an dung Spring Boot backend, PostgreSQL database va React frontend. Trong migration database da co cac bang `tasks`, `task_assignees`, `task_checklists`. Hay xem backend hien tai da co Task entity, repository, service, controller chua va frontend da goi API that chua. Sau do ket luan ro phan nao da dung, phan nao con thieu, va buoc tiep theo can lam de chuyen tu demo UI sang chuc nang that co luu database.
```

**Ket qua su dung:** Dung de quyet dinh chuyen Kanban tu mock data sang backend API va PostgreSQL.

### Prompt 6 - Them backend Task API

```text
Ban la backend developer chuyen Spring Boot, JPA/Hibernate va PostgreSQL. Du an DevTrack AI hien dang to chuc backend theo layer-based gom `controller`, `dto`, `entity`, `repository`, `service`, `service/impl`. Database migration da co bang `tasks`, `task_assignees`, `task_checklists`, nen toi khong muon tao migration moi neu chua can. Hay giup toi them backend Task API theo dung cau truc hien tai, gom Task entity, TaskChecklist entity, enum TaskStatus/TaskType/Priority, TaskRepository, TaskChecklistRepository, TaskService, TaskServiceImpl, TaskController va DTO request/response. API can ho tro lay task theo project, tao task, sua task, xoa task, cap nhat status, cap nhat assignee va lay My Tasks. Hay luu y kiem tra user phai la member cua project truoc khi xem hoac thao tac task.
```

**Ket qua su dung:** Dung de them cac file backend Task theo cau truc layer-based.

### Prompt 7 - Noi frontend voi backend API

```text
Toi can noi frontend Kanban voi backend API that. Ban hay dong vai frontend developer chuyen React architecture. Module Kanban nam trong `features/kanban`, con team quy dinh file goi API frontend-backend nen dat trong folder `services`. Backend da co Task API. Hay tao huong trien khai voi `features/kanban/services/taskService.js` de goi API va `features/kanban/utils/taskMapper.js` de map du lieu backend sang UI. API tra ve cac field nhu `primaryAssignee`, `requirementId`, `sprintId`, `status`, `type`, nhung UI can hien thi assignee name/initials, requirement label, sprint label va type ngan nhu DEV hoac UI/UX. Hay cap nhat Zustand store de fetch task theo project, tao/sua/xoa task, update status khi keo tha va fetch My Tasks.
```

**Ket qua su dung:** Dung de them `services/taskService.js`, `utils/taskMapper.js` va sua Kanban store.

### Prompt 8 - Kiem tra Git truoc khi push
 
```text
Toi da hoan thanh code Module 3 Task/Kanban va chuan bi push len Git trong project nhom. Ban hay dong vai mentor huong dan Git an toan. Hay giup toi kiem tra `git status`, xac dinh file nao nen commit, file nao khong nen push, vi du khong push `application.yaml`, `node_modules`, `dist`, `target`, file ghi chu ca nhan hoac package-lock o root neu tao nham. Toi cung can doi ten branch dung convention thanh `feature/de190364-task-crud`, viet commit message phu hop va chi push theo quy dinh cua team. Hay huong dan tung buoc ngan gon de toi chay lenh, chup man hinh ket qua roi lam buoc tiep theo.
```
 
**Ket qua su dung:** Dung de kiem tra branch, file stage, commit message va `.gitignore`.
 
### Prompt 9 - Refactor static HTML sang React component va modular hoa UI
 
```text
Hien gio toi da co 3 trang giao dien (Task Board, Task Detail, My Tasks) do stick (designer) tao ra bang HTML tinh. Toi muon lam phan Frontend truoc, ban hay xem cay thu muc trong frontend va cho toi biet phai tao cac file nhu the nao. Toi se dua ma HTML cho ban va nho ban giup refactor thanh cac component React va Zustand store hop le theo features/kanban, sau do chia nho KanbanBoardPage thanh cac component con nhu KanbanColumn, TaskCard, KanbanFilters, KanbanHeader, TaskDetailDrawer, TaskFormModal de de quan ly va ho tro logic sau nay.
```
 
**Ket qua su dung:** Dung de thiet lap toan bo cau truc UI Kanban, tach nho cac component con tu trang HTML tinh cua designer.
 
### Prompt 10 - Thiet lap moi truong local va debug loi bat dau backend
 
```text
Toi muon ban giup kiem tra va thiet lap de chay Backend server Spring Boot len de test fullstack. Toi dang dung PostgreSQL voi password local la 123. Hay huong dan toi cau hinh file application.yaml o dau va lieu viec cau hinh nay co anh huong den code chung cua ca nhom khi day len git repository khong. Ngoai ra khi toi go cd fronrend va gap loi run terminal hoac gap loi 'Unable to connect to Redis' khi bat backend thi phai xu ly nhu the nao.
```
 
**Ket qua su dung:** Dung de tao dung file application.yaml cho postgres local ma khong bi commit nham len git, sua dung duong dan cd frontend va phan tich nguyen nhan loi thieu Redis server.
 
## 3. Prompt quan trong nhat

Prompt quan trong nhat la Prompt 5 vi no giup xac dinh Module 3 chua nen dung lai o UI demo ma can ket noi backend/database that. Tu do em chuyen huong sang them Task API va service frontend.

## 4. Bai hoc ve cach viet prompt

Prompt tot nen co du vai tro AI, boi canh project, yeu cau cu the, format mong muon va vi du. Khi prompt noi ro project dang dung React, Zustand, Spring Boot va PostgreSQL, AI tra loi sat voi cau truc du an hon va de ap dung hon.

---

## 5. Prompt bo sung - Task SLA, Daily Digest, Sprint Report va Event-driven SLA

Phan nay chi ghi cac prompt/chude quan trong co anh huong den thiet ke va trien khai chuc nang. Cac cau hoi nho ve bug vat, thao tac Git don le, loi dang nhap, bai tap ngoai project hoac hoi ngoai le khong duoc dua vao.

### Prompt 11 - Phan tich nhiem vu Task SLA va Daily Digest

```text
Toi moi dam nhan phan quan ly task va nhac nho. Yeu cau gom F2.1 quan ly thuoc tinh task, F2.2 Daily Digest chong spam mail, F2.3 SLA Penalty. Hay giup toi hieu nghiep vu, tach cac van de can lam, dua ra cac giai phap co the thuc hien, va chi thao luan truoc khi code.
```

**Ket qua su dung:** Dung de hinh thanh huong lam Task SLA theo rule backend, Daily Digest, scheduler, email log va penalty log.

### Prompt 12 - Ra soat Task SLA, Daily Digest va Weekly/Sprint Report

```text
Ban hay doc lai code va chu tam phan Bao cao Task SLA, Daily Digest & Weekly Report. Hay cho toi biet backend/frontend da co gi, con thieu gi, UI dang dung data that hay fallback, va can bo sung gi de demo duoc.
```

**Ket qua su dung:** Dung de ra soat hien trang SLA/report, dong bo frontend voi backend, va ghi tai lieu tong hop.

### Prompt 13 - Thiet ke giao dien Report co metric cards va SLA flags

```text
Toi muon giao dien report co 4 metric cards, member status panel, SLA flags, scheduler panel, weekly report tab va nut generate. Hay xem y tuong nay co hop ly khong, can thiet ke ra sao de leader/mentor nhin nhanh tinh hinh sprint.
```

**Ket qua su dung:** Dung de dinh huong Sprint/Weekly Report thanh dashboard co metric, risk table, scheduler/outbox panel va summary.

### Prompt 14 - Bat Kafka that cho notification realtime

```text
Hay bat Kafka that trong backend. Them application.yaml config, tao KafkaNotificationConsumer lang nghe cac topic task/notification/sla/email, parse payload JSON va push realtime qua NotificationWebSocketHandler.sendToUser. Giu OutboxPublisherService lam fallback retry, khong doi entity va khong doi WebSocket handler.
```

**Ket qua su dung:** Dung de them KafkaNotificationConsumer, KafkaEventPublisher envelope va retry failed events.

### Prompt 15 - Event-driven SLA voi Kafka

```text
Implement Event-Driven SLA voi Kafka. Tao SlaEventConsumer lang nghe devtrack.task.events va devtrack.sla.events, parse taskId, goi TaskSlaRuleService.evaluate, luu state/log neu can, gui notification cho DUE_TODAY, DUE_TOMORROW, OVERDUE_SHORT. Them retry/DLT va publish event khi task/evidence thay doi.
```

**Ket qua su dung:** Dung de hinh thanh SlaEventConsumer, SlaStateService, task_sla_states va sla_decision_logs.

### Prompt 16 - Tach biet Daily Digest theo project

```text
Moi project phai la mot moi truong doc lap. Hay doc code Daily Digest/SLA reminder va sua de khong tron task/email giua cac project. DailyDigest phai co project_id, query task theo projectId, endpoint test trigger phai la /projects/{projectId}/digests/test-trigger.
```

**Ket qua su dung:** Dung de them project isolation cho Daily Digest, migration project_id, repository query theo project va frontend trigger theo activeProject.id.

### Prompt 17 - Tong hop hanh trinh SLA len Level 5

```text
Hay nhin lai qua trinh phat trien phan SLA trong du an: tu reminder don gian, SLA rule, Daily Digest, Sprint Report, Kafka, Project Isolation, Decision Pack den huong Level 5 Autonomous Project Manager. Ghi thanh story qua trinh phat trien vao folder Tin.
```

**Ket qua su dung:** Dung de tao tai lieu `SLA_LEVEL5_EVOLUTION_JOURNEY.md` va dinh vi hien trang la Level 4, Level 5 la huong Human-approved Recovery Plan.

### Prompt 18 - Lap ke hoach Full SLA Core truoc AI

```text
Truoc khi them AI, hay lap ke hoach lam Full SLA Core. Can gom tat ca luong quyet dinh SLA ve mot truc chinh, them daily recheck event, gom penalty vao action workflow, them action log/idempotency, project isolation va Decision Pack UI.
```

**Ket qua su dung:** Dung de chia Full SLA Core thanh cac giai doan:
- Giai doan 1-4: SlaStateService/SlaActionService/penalty/daily recheck.
- Giai doan 5-6: SlaActionLog/action_key/project isolation.
- Giai doan 7-8: Decision Pack API/UI.

### Prompt 19 - Sua Prompt 2 theo code thuc te

```text
Hay doc code hien tai roi viet lai prompt giai doan 5-6 cho dung voi thuc te. Code da co SlaActionService, SlaStateService, scheduler recheck, TaskPenaltyService. Prompt moi chi nen tap trung vao SlaActionLog, action_key va project isolation.
```

**Ket qua su dung:** Dung de tranh prompt sai thuc te, vi code da co SlaActionService. Prompt moi tap trung vao nang cap service hien co thay vi tao lai.

### Prompt 20 - Kiem tra Full SLA Core da xong chua

```text
Ban xem thu da xong chua. Kiem tra co SlaActionLog/action_key, repository project-scoped, Decision Pack API/UI, scheduler project-scoped va chay backend/frontend build.
```

**Ket qua su dung:** Dung de xac nhan backend compile pass, frontend build pass, dong thoi phat hien duplicate check bang title co the chan reminder o ngay sau.

### Prompt 21 - Sua duplicate reminder theo action_key

```text
Ngay mai no co nhac lai khong? Hay sua de trong cung ngay khong spam nhung khac ngay hoac khac category thi van duoc gui reminder neu task con risk.
```

**Ket qua su dung:** Dung de sua `SlaActionService`, bo duplicate check dua tren notification title cho assignee reminder va chi dung `action_key` lam co che chong spam chinh.

---

## 6. Prompt bo sung - Recovery Plan, Adaptive SLA va Reliability Evidence

Phan nay ghi cac prompt quan trong sau Full SLA Core. Cac prompt duoc loc theo tieu chi: co anh huong den architecture, code, test, commit hoac cach defend module. Cac cau hoi nho ve IDE, GitHub chart, quota, file agent, hoac giai thich thuat ngu don le khong dua vao.

### Prompt 22 - Thiet ke Recovery Plan theo Human-in-the-loop

```text
SLA hien tai da co risk/state/log/decision pack. Bay gio muon len Level 5 thi lam Recovery Plan nhu the nao cho dung SWP391, khong over-engineer? Can co generate plan, leader approve/reject, execute safe actions va audit log. Hay doc code hien tai, de xuat backend flow phu hop va chi ro file/entity/repository/service/controller can co.
```

**Ket qua su dung:** Dung de thiet ke Recovery Plan backend flow theo Human-in-the-loop, them plan/action/audit log, approve/reject/execute va unique active plan per task.

### Prompt 23 - Dua AI vao Recovery Plan nhung khong cho AI tu y thay doi du lieu

```text
Recovery Plan rule-based da chay duoc nhung summary/action message con cung va de gay cam giac bi he thong phat. Co nen dua AI vao khong? Hay de xuat cach dung Gemini de sinh summary/message mem hon, nhung backend van giu rule va leader van approve truoc khi execute.
```

**Ket qua su dung:** Dung de dinh huong AI chi lam lop reasoning/message, backend rule van la nguon quyet dinh chinh, va human approval gate van bat buoc.

### Prompt 24 - Adaptive AI Recovery Loop va follow-up plan

```text
Toi muon Recovery Plan thong minh hon: Gemini co the de xuat action, nhung action phai nam trong whitelist. Neu execute xong ma score khong cai thien thi scheduler sau 24h phai detect ineffective va tao follow-up plan. Hay thiet ke flow, guard an toan va noi ro phan nao AI duoc lam, phan nao backend rule quyet dinh.
```

**Ket qua su dung:** Dung de them AI selectedActions co whitelist, fallback rule-based, effectiveness tracking va follow-up recovery plan co guard chong lap.

### Prompt 25 - Hybrid Rule-based SLA Scoring va burn rate prediction

```text
SLA score hien tai con tho. Hay nang cap theo huong deterministic, khong dung AI de tinh diem. Can co burn rate, progress percent, SPI, predicted risk level, prediction reasons va score breakdown. Luu y AI chi giai thich/de xuat, core score phai rule-based de defend duoc.
```

**Ket qua su dung:** Dung de refactor SLA scoring sang hybrid rule-based scoring, them burn rate, SPI, predicted risk va score breakdown vao Decision Pack.

### Prompt 26 - Lay code moi nhat va kiem tra 3 prompt SLA

```text
Len GitHub lay code moi nhat ve. Sau do toi se dua 3 prompt SLA, ban doc code that va kiem tra da lam dung chua, thieu gi thi bao ro. Khong de xuat lung tung neu khong can.
```

**Ket qua su dung:** Dung de merge latest `develop`, kiem tra Scheduler Logs UI, Async SLA Analysis Job, Recovery Plan Dashboard va xac dinh cac gap can fix.

### Prompt 27 - Fix duplicate SLA Analysis Job

```text
SlaAnalysisJobService.createJob() hien tai luon tao job moi. Neu user bam Refresh 2 lan nhanh thi co 2 job cung projectId/sprintId, goi Gemini 2 lan va snapshot co the bi ghi de. Hay them query find job PENDING/RUNNING, neu co thi tra job cu, khong tao moi, log warn.
```

**Ket qua su dung:** Dung de them duplicate job prevention trong service, skip duplicate async execution va sau do bo sung DB unique index cho active SLA job.

### Prompt 28 - Evidence Snapshot cho Recovery Plan

```text
Sau khi leader execute recovery plan, scheduler checkEffectivenessForExecutedPlans() chi luu scoreBeforeExecution va scoreAfterExecution. Hay them evidenceSnapshotId bang cach computeAndPersist reliability snapshot sau effectiveness check, fail thi log warn khong lam hong luong chinh, va UI hien link reliability khi co evidence.
```

**Ket qua su dung:** Dung de them `evidenceSnapshotId`, migration, mapping response va UI evidence link trong Recovery Plan Dashboard.

### Prompt 29 - Recovery Gate Result

```text
EXECUTED dang dong 2 vai: action da chay xong va ket qua ok. Huong clean la giu status lam process state, them gateResult PASSED/FAILED/INSUFFICIENT_DATA va gateReason. Hay sua checkEffectivenessForExecutedPlans(), evaluateGate(), response mapping va frontend card.
```

**Ket qua su dung:** Dung de them gate result/gate reason, tach status voi outcome verdict, hien gate result UI va tao follow-up khi gate FAILED.

### Prompt 30 - Hoc tu phan Distributed lock/Redis cua Dat nhung ap dung dung code hien tai

```text
Xem code that xem co can them Distributed lock/Redis khong. Neu khong can thi noi khong, dung de xuat lung tung. Neu can thi noi ro cho phan nao cua SLA/Recovery Plan.
```

**Ket qua su dung:** Dung de ket luan chua can Redis lock, nen uu tien DB constraint va row lock. Sau do them `findByIdForUpdate()` voi `PESSIMISTIC_WRITE` cho approve/reject/execute recovery plan va unique partial index cho active SLA analysis job.

### Prompt 31 - Ghi lai du lieu cho AI Audit

```text
Ghi vao folder Tin de co du lieu sau nay dua vao AI Audit. Sau do loc tat ca cuoc tro chuyen chua dua vao audit, chi lay phan co gia tri code/thiet ke/test/commit, bo qua cau hoi nho.
```

**Ket qua su dung:** Dung de tao file local `Tin/SLA_RELIABILITY_RECOVERY_SESSION_20260619.md`, sau do cap nhat `Nguyen_Le_Trung_Tin/AI_AUDIT_LOG.md`, `CHANGELOG.md`, `PROMPTS.md` va `REFLECTION.md`.

## 7. Prompt dang gia nhat sau phan bo sung

Prompt 30 la prompt dang gia nhat ve mat engineering vi no giup em khong them Redis lock theo phong trao. Thay vao do, em hoc cach chon giai phap vua du voi codebase: idempotency o service, DB unique constraint lam hang rao cuoi, va row lock cho cac thao tac doi trang thai quan trong. Day la bai hoc giup code an toan hon ma khong lam he thong phuc tap qua muc.

---

## 8. Prompt bo sung - Nang cap Outbox Pattern va Admin Job Dashboard

### Prompt 32 - Trien khai kien truc Outbox Pattern Production-ready

```text
Toi co mot du an Spring Boot + React (Vite). Hien tai da co Outbox Pattern ban dau, nhung de len production can xu ly them: Idempotency Key, Graceful Shutdown cho cac ThreadPoolTaskExecutor, Dead Letter Queue (DLQ), Job Cleanup rác, tao Admin REST APIs de monitor va xay dung Frontend UI (React + Tailwind). Hay dua ra ke hoach trien khai chi tiet va day du.
```

**Ket qua su dung:** Dung de xac dinh cac buoc can lam de nang cap Outbox Pattern cho chuan production: tu Database, Logic, API den UI.

### Prompt 33 - Unit Test cho Idempotency Key

```text
Hay viet Unit Test (JUnit 5 + Mockito) cho viec tao Idempotency Key, kiem chung duplicate handling khi save event thu 2 (xu ly `DataIntegrityViolationException` an toan) trong `OutboxEventServiceTest`.
```

**Ket qua su dung:** Dung de bao dam code hoat dong dung luong nghiep vu ngay ca khi xay ra tranh chap luu data.

## 9. Prompt dang gia nhat cho phan Outbox

Prompt 32 mang tinh he thong nhat boi no khong chi xu ly loi don le ma nang cap ca mot kien truc he thong quan trong giup he thong de dang bao tri va van hanh (monitor/retry) thong qua giao dien.

---

## 10. Prompt bo sung - Co che Data Synchronization va WebSocket Realtime

### Prompt 34 - Trien khai kien truc Data Sync cho Sprint va Task

```text
Toi can xay dung mot Data Synchronization Mechanism. Hien tai khi Task thay doi trang thai, Sprint khong tu dong cap nhat progress va Frontend cung khong nhan duoc thong bao realtime. Toi muon dung Spring ApplicationEvent de decouple, luu log (EntitySyncLog) va STOMP WebSocket de bao Frontend. O Frontend, tao hook `useSyncStatus` va hien thi badge tren Sidebar. Hay lap plan trien khai cho chuc nang nay nhe.
```

**Ket qua su dung:** Dung de len plan kien truc tong the cho chuc nang Data Synchronization, giup viec ket noi trang thai giua Frontend va Backend duoc dong bo qua websocket, giu tinh loose coupling cho DB.

### Prompt 35 - Viet Unit Test cho DataSyncService

```text
Hay viet `DataSyncServiceTest` (su dung Mockito) de test luong `handleSyncEvent` khi Task thay doi trang thai thanh COMPLETED. Dam bao no goi `syncStatusRepository.upsert` de cap nhat Sprint va `messagingTemplate.convertAndSend` ban dung STOMP payload xuong Frontend.
```

**Ket qua su dung:** Bao dam service lang nghe su kien va thuc thi dung 2 nhiem vu quan trong nhat la database upsert va ban STOMP message.

---

## 11. Prompt bo sung - Custom System Health Checks and Job Monitoring

### Prompt 36 - Xay dung Custom Monitoring & Health Check

```text
Tôi có dự án Spring Boot 3 (package: org.example.backend) quản lý dự án học thuật. Spring Actuator CHƯA có — tự implement custom health checks. Hãy giúp tôi tạo Flyway migration, Entity, Repository, Monitoring Executor, @MonitoredJob annotation, MonitoringAspect, HealthCheckService, AlertService qua email, System Monitor Scheduler, DTOs, Admin REST API, và React Frontend update cho trang JobDashboardPage.jsx. Và nhớ viết Unit tests nữa nhé.
```

**Ket qua su dung:** Dung de xay dung he thong giam sat chu dong tu custom code (khong phu thuoc vao Actuator), giup nguoi quan tri de dang theo doi suc khoe cua database, disk, memory va lich trinh cac job quan trong tu Admin UI.

---

## 12. Prompt bo sung - AI Training Foundation va Sprint Summary

### Prompt 37 - Xay dung nen tang du lieu cho AI Training

```text
He thong SLA hien co risk level va decision log nhung khong co co che kiem tra xem du doan co chinh xac hay khong sau khi sprint ket thuc. Hay giup em them: (1) predictionConfidence tinh tu khoang cach score den ranh gioi zone, (2) backfill predictionAccurate trong DataSyncScheduler khi sprint auto-complete bang cach so sanh predictedRiskLevel vs ket qua task thuc te, (3) projectId vao AuditLog extract tu request URI bang regex /projects/(\d+), (4) DB view v_member_ai_features join weekly_report_members va task_sla_states de lay feature vector san cho ML model.
```

**Ket qua su dung:** Dung de xay dung luong thu thap training data co label cho ML model, dam bao co co che kiem tra accuracy de evaluate model sau nay.

### Prompt 38 - AI Sprint Completion Summary + Member Evaluation 4 section

```text
Khi sprint chuyen sang COMPLETED, hay tu dong goi Gemini sinh mot bao cao tong ket sprint theo 6 tieu chi: Goal Achievement, Delivery, Quality, Teamwork, Process, Improvement Areas. Chi generate mot lan, luu vao bang rieng. Ngoai ra phan danh gia thanh vien hien tra ve text thang, hay cau truc lai thanh 4 phan: Performance Summary, Strengths, Areas for Improvement, Potential Risks. Frontend render moi phan la mot card co mau rieng.
```

**Ket qua su dung:** Dung de tao `SprintCompletionService`, `GeminiSprintNarrativeService`, `GeminiMemberNarrativeService` va cap nhat Sprint Health UI.

---

## 13. Prompt bo sung - 5-criteria Evaluation va Project Closure

### Prompt 39 - Danh gia thanh vien 5 tieu chi khach quan + WebSocket done signal

```text
Danh gia thanh vien hien tai chi dua vao text Gemini sinh ra, thieu so lieu do luong. Hay them 5 tieu chi truoc khi goi Gemini: delivery reliability, task weight, proactiveness (so ngay trung binh som/tre), priority handling, workload volume. Gemini chi sinh 2 cau ngan max 35 tu, goi ten thanh vien truc tiep, tranh noi chung chung. Them WebSocket broadcast khi AI generate xong de frontend tu refresh thay vi hardcode wait 60s.
```

**Ket qua su dung:** Dung de nang cap `SprintCompletionService` tinh 5 tieu chi, cap nhat Gemini prompt trong `GeminiMemberNarrativeService`, them `broadcastSprintAiDone` va cap nhat frontend lang nghe WebSocket.

### Prompt 40 - Quy trinh dong project hoan chinh + Quality Score + Excel 3 sheet

```text
Project hien chua co quy trinh dong chinh thuc. Hay xay dung: pre-close check task/bug/sprint chua xong, trang thai ARCHIVED khoa CRUD, reopen voi ly do luu AuditLog, ma task TSK-001 tuan tu theo project, auto-track actualHours va qualityScore khi task DONE, Quality Score (1-10) tu deadline penalty va SLA penalty, Task Points = Weight * Priority Factor * (Quality/10), Excel 3 sheet (Tasks by sprint, Member Summary, Formula), ProjectClosureModal wizard 4 buoc, BugReport lock khi ARCHIVED, notification realtime + PROJECT_CLOSED outbox event khi dong.
```

**Ket qua su dung:** Dung de xay dung toan bo `ProjectTrackingExportService`, `ProjectServiceImpl.closeProject()`, `ProjectClosureModal.jsx` va migration closure.

---

## 14. Prompt bo sung - FastAPI ML Microservice + RAG + RLHF

### Prompt 41 - Kien truc FastAPI ML Microservice tach biet

```text
Em muon tach phan ML du doan SLA risk ra microservice rieng, khong embed vao Spring Boot. Hay de xuat kien truc: FastAPI port 8001, PyTorch multi-task model du bao risk level + penalty probability + recovery priority tu 37 features (deadline gap, burn rate, evidence count, blocker, workload...). Spring Boot can MlFeatureBuilder chuan bi vector va MlServiceClient goi HTTP voi fallback rule-based neu service down. Them Dockerfile + docker-compose.
```

**Ket qua su dung:** Dung de xay dung toan bo `ml-service/` voi FastAPI, PyTorch model 86.5% accuracy, `MlFeatureBuilder.java`, `MlServiceClient.java` va Dockerfile.

### Prompt 42 - RAG context injection cho Gemini Recovery Plan + RLHF feedback loop

```text
Gemini dang sinh recovery plan tu prompt thuan tuy, khong biet plan nao da tung hieu qua. Hay them RAG: FAISS vector store tu 500 plan lich su dung sentence-transformers all-MiniLM-L6-v2 (384-dim), khi generate plan moi thi tim top-3 plan tuong tu va inject vao Gemini prompt. Them RLHF: leader approve/reject/gate_result gui signal, phan loai STRONG/WEAK POSITIVE/NEGATIVE, tu dong rebuild FAISS khi du 50 strong signals. Chu y fix van de Unicode path cua FAISS tren Windows.
```

**Ket qua su dung:** Dung de xay dung `app/rag/` (embedder, faiss_store, build_index), cac endpoint `/recovery/similar`, `/recovery/generate-plan`, `/feedback/signal`, `/train/trigger`, `/train/status`; flow chinh la Spring Boot `MlServiceClient` -> FastAPI ML Service -> RAG -> Ollama/Gemini. `GeminiRecoveryService.generateWithRagContext()` duoc giu nhu legacy/deprecated direct-Gemini path, khong phai flow chinh.
