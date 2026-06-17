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
