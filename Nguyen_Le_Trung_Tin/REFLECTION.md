# Reflection - Nguyen Le Trung Tin

## 1. Tong quan

Trong Module 3, em phu trach Task/Kanban Management cho du an DevTrack AI. Day la module ket hop ca frontend va backend: nguoi dung co the xem Task Board, keo tha task giua cac cot, xem chi tiet task, tao/sua/xoa task, gan assignee va xem My Tasks.

## 2. AI da ho tro em o diem nao

AI ho tro em nhieu nhat o cac diem:

- Phan tich nen lam Module 3 theo thu tu nao.
- De xuat cach tach Kanban UI thanh components va store.
- Giai thich nguyen ly drag/drop task giua cac cot.
- Phan tich su khac nhau giua task drawer va full detail page.
- Kiem tra huong lam UI demo co dung voi du an that chua.
- De xuat them backend Task API theo cau truc layer-based cua project.
- De xuat frontend service/mapper de noi API that.
- Huong dan kiem tra Git, branch, commit message va file khong nen push.

## 3. Phan em tu lam va tu chinh sua

Em khong chi copy ket qua AI ma da tu kiem tra lai theo codebase hien co:

- Kiem tra backend dang dung layer-based nen khong refactor sang module-based.
- Kiem tra frontend cac module khac dung folder `services`, sau do sua Kanban theo convention nay.
- Kiem tra `.gitignore` de khong push file local.
- Kiem tra `git status` de chi stage file lien quan Module 3.
- Kiem tra lai route, sidebar va hanh vi reload workspace.
- Chay build backend/frontend de xac nhan code compile.

## 4. Dieu hoc duoc ve ky thuat

Qua Module 3, em hieu ro hon cach trien khai mot chuc nang full-stack:

- Frontend nen tach page, component, store, service va mapper ro rang.
- Backend nen co controller, dto, entity, repository, service va service implementation.
- Neu database schema da co san thi khong nen sua migration cu hoac tao migration moi khong can thiet.
- Khi map du lieu backend sang UI nen tach mapper rieng de component de doc hon.
- Khi lam project nhom can theo convention san co thay vi tu dat cau truc moi.

## 5. Dieu hoc duoc ve su dung AI co trach nhiem

AI co the giup tang toc phan tich va trien khai, nhung can:

- Cung cap boi canh ro rang ve project.
- Yeu cau AI doc theo cau truc hien co.
- Kiem tra lai ket qua AI bang build/test/git status.
- Khong push file local hoac config ca nhan.
- Khong dung AI thay the viec hieu code.
- Ghi lai prompt va phan AI da ho tro mot cach minh bach.

## 6. Han che va huong cai thien

Han che hien tai la em chua test end-to-end day du voi database that vi DB local chua co du project/member/task. Huong cai thien tiep theo la seed data trong PostgreSQL, login user, vao project, tao task, keo tha task, sua assignee va kiem tra My Tasks.

## 7. Tu danh gia

| Tieu chi | Diem 1-5 | Ghi chu |
|---|:---:|---|
| Hieu yeu cau Module 3 | 4 | Da nam duoc luong Task/Kanban |
| To chuc frontend | 4 | Da tach features/kanban ro rang |
| To chuc backend | 4 | Theo dung layer-based hien co |
| Kiem chung code | 4 | Build backend/frontend pass |
| Su dung AI minh bach | 4 | Co ghi lai prompt va phan AI ho tro |

## 8. Ket luan

Module 3 da hoan thanh phan code chinh va da duoc tich hop vao cau truc du an. AI ho tro em trong viec phan tich, dinh huong va trien khai, nhung em van can tu kiem tra, sua lai theo convention team va dam bao co the giai thich duoc code da lam.

---

## 9. Reflection bo sung - Task SLA, Daily Digest va Event-driven SLA

Sau Module 3 Task/Kanban, em tiep tuc tham gia phan Task SLA, Daily Digest, Sprint Report va Notification. Day la giai doan em hoc duoc nhieu hon ve cac tac vu backend tu dong, xu ly theo thoi gian va cach thiet ke chuc nang de vua dung nghiep vu vua co the demo ro rang.

### 9.1. AI da ho tro em o diem nao

AI ho tro em:

- Phan tich yeu cau Task SLA va nhac nho thong minh.
- Giai thich cach tach Daily Digest, SLA rule, scheduler, penalty va notification.
- De xuat cach tranh spam email bang Daily Digest va action idempotency.
- Giai thich vai tro cua scheduler, cron job, outbox event va Kafka.
- Ho tro thiet ke Sprint/Weekly Report co metric cards, SLA risk table va scheduler panel.
- Ho tro nang cap SLA tu rule co ban thanh Event-driven SLA co state va decision log.
- Ho tro phan tich Project Isolation de khong tron task/email giua cac project.
- Ho tro lap ke hoach Full SLA Core truoc khi them AI/Recovery Plan.

### 9.2. Phan em tu suy nghi va quyet dinh

Em khong dung AI de thay the viec quyet dinh nghiep vu. Mot so quyet dinh em da chon sau khi trao doi:

- Khong gui email realtime cho moi thay doi nho, vi de gay spam.
- Dung Daily Digest de gom thong tin can nhac trong ngay.
- Phan biet task sap den han, deadline hom nay, tre ngan va tre du dieu kien penalty.
- Tre duoi 3 ngay la warning period, tre tu 3 ngay tro len moi penalty.
- Moi project phai la mot workspace rieng, Daily Digest/SLA Reminder khong duoc tron project.
- Truoc khi dung AI/Recovery Plan, phai lam SLA Core deterministic that chac.
- SLA Core phai co rule ro rang, state, log, action log va UI Decision Pack.

### 9.3. Dieu hoc duoc ve ky thuat

Qua phan nay, em hoc duoc:

- Scheduler dung de xu ly cac nghiep vu phu thuoc thoi gian nhu deadline, digest va report.
- Outbox pattern giup tach viec tao event khoi viec publish event.
- Kafka chi nen dung khi co ly do that, vi du task/evidence thay doi thi can re-evaluate SLA.
- SLA khong nen chi la if/else trong mot service lon; can co read model va decision log de giai thich.
- `action_key` tot hon duplicate check bang title vi no co ngay, category, user, task va project.
- Project isolation rat quan trong voi he thong quan ly nhieu project.
- UI Decision Pack giup bien du lieu backend thanh thu co the nhin thay khi demo.

### 9.4. Cach em kiem chung ket qua AI

Em khong chi nhan ket qua AI ma co kiem tra lai bang:

- Doc code hien co truoc khi yeu cau sua.
- Yeu cau AI so sanh y tuong voi thuc te da implement.
- Chay backend compile.
- Chay frontend build.
- Kiem tra repository/query co projectId hay khong.
- Kiem tra duplicate notification co bi chan qua muc hay khong.
- Yeu cau giai thich root cause khi gap loi JPA/Hibernate.

### 9.5. Bai hoc lon nhat

Bai hoc lon nhat la: AI co the giup em nghi ra huong nang cap, nhung core nghiep vu nhu SLA phai deterministic, co rule ro rang va co log kiem chung. AI khong nen la noi tinh SLA. AI chi nen la lop ho tro sau nay de giai thich, tong hop va de xuat recovery plan dua tren du lieu SLA da duoc tinh dung.

### 9.6. Huong phat trien tiep theo

Huong tiep theo cua phan SLA la:

- Hoan thien UI SLA Decision Pack.
- Bo sung test cho rule, state, action log va project isolation.
- Sau khi SLA Core chac, moi phat trien Recovery Plan co leader approval.
- Khong claim he thong la full autonomous neu chua co approve/apply/audit workflow day du.

---

## 10. Reflection bo sung - Recovery Plan, Reliability Evidence va Engineering Safety

Sau khi SLA Core da co state, log va decision pack, em tiep tuc mo rong phan nay thanh mot luong co kha nang ho tro leader ra quyet dinh va theo doi ket qua sau khi hanh dong. Day la giai doan em thay ro su khac nhau giua "he thong canh bao" va "he thong co bang chung de chung minh hanh dong co hieu qua hay khong".

### 10.1. AI da ho tro em o diem nao

AI ho tro em:

- Phan tich cach dua SLA len huong Recovery Plan co Human-in-the-loop.
- Giai thich vi sao AI khong nen duoc tu y thay doi task neu chua co leader approval.
- De xuat cach dung Gemini de sinh summary/action message mem hon nhung backend van giu rule an toan.
- Thiet ke Adaptive Recovery Loop: execute plan xong thi scheduler check hieu qua va tao follow-up neu can.
- Giai thich cach tach `status` va `gateResult` de tranh nhap nhang giua trang thai xu ly va ket qua that.
- Ho tro kiem tra code that de tim rui ro duplicate job, duplicate execute va race condition.
- Giai thich idempotency, DB constraint, row lock va khi nao moi can Redis/distributed lock.

### 10.2. Dieu em thay hay nhat trong phan moi

Phan hay nhat la Recovery Plan khong chi dung lai o viec "AI goi y". He thong co tron mot vong lap:

```text
Detect risk
-> Explain why
-> Generate recovery plan
-> Leader approve
-> Execute safe actions
-> Capture evidence snapshot
-> Evaluate gate result
-> Create follow-up if failed
```

Vong lap nay giup em defend ro hon: AI khong phai trung tam quyet dinh, ma la lop ho tro. Backend rule, database constraint, audit log va evidence snapshot moi la phan lam cho he thong dang tin.

### 10.3. Phan em tu suy nghi va quyet dinh

Em da chon cac huong sau sau khi trao doi voi AI:

- Khong them `EFFECTIVE` status rieng, vi se lam roi giua `EXECUTED` va `EFFECTIVE`.
- Tach `gateResult` thanh `PASSED`, `FAILED`, `INSUFFICIENT_DATA` de bieu dien outcome.
- Khong them Redis lock ngay, vi code hien tai dung Postgres/Flyway va DB row lock la vua du.
- Dung unique partial index cho SLA analysis job thay vi chi check bang code.
- Dung row lock khi approve/reject/execute recovery plan de tranh double click hoac request song song.
- Dung evidence snapshot de chung minh reliability thay doi, khong chi dua vao hai con so score before/after.

### 10.4. Dieu hoc duoc ve engineering safety

Giai doan nay giup em hieu ro hon mot bai hoc quan trong: code dung logic chua chac da an toan khi co nhieu request cung luc. Vi du:

- Service check truoc khi insert co the van bi race neu 2 request vao cung luc.
- User double-click execute co the lam hai request cung doc thay plan dang `APPROVED`.
- Scheduler/job chay song song co the lam ghi de snapshot neu khong co hang rao DB.

Tu do em hoc duoc 3 tang bao ve:

- Idempotency: goi lai nhieu lan khong tao ket qua lap.
- DB constraint: database chan duplicate o tang cuoi.
- Row lock: khoa dong dang xu ly de request khac phai cho.

### 10.5. Dieu hoc duoc ve evidence

Truoc day em hay nghi score before/after la du. Sau phan Evidence Snapshot, em hieu rang trong mot he thong quan ly du an, diem so thoi chua du thuyet phuc. Can co bang chung di kem:

- Snapshot duoc tinh luc nao.
- Sprint nao, project nao.
- MTTR/MTBF/Availability/Error Budget ra sao.
- Gate result vi sao pass/fail.

Nho vay leader/mentor co the xem lai logic thay vi chi thay mot ket luan "plan hieu qua" hay "plan that bai".

### 10.6. Cach em kiem chung ket qua AI

Em khong chi dua vao cau tra loi cua AI ma da:

- Yeu cau AI doc code that truoc khi nhan xet.
- Doi chieu prompt voi file service/repository/migration/frontend.
- Chay backend compile.
- Kiem tra `git status`, chia commit theo convention nhom.
- Tach commit theo nhom de sau nay review de hon:
  - SLA Reliability Monitoring.
  - Recovery Plan Evidence Gate.
  - Migration idempotent fix.
- Ghi lai du lieu local trong folder `Tin` truoc khi dua vao audit chinh.

### 10.7. Bai hoc lon nhat

Bai hoc lon nhat cua em la: mot tinh nang "hay" khong nhat thiet phai la them AI that nhieu. Cai hay nam o viec biet dat AI dung cho, va dung nhung co che engineering co the kiem chung duoc.

Trong phan nay, AI giup sinh reasoning va de xuat huong, nhung cac phan quan trong nhat van la:

- rule-based scoring,
- human approval,
- audit log,
- evidence snapshot,
- DB constraint,
- row lock,
- build/test verification.

Nho vay em co the giai thich voi giang vien rang he thong khong "tu dong cho vui", ma co gate, co bang chung va co hang rao an toan.

### 10.8. Tu danh gia cap nhat

| Tieu chi | Diem 1-5 | Ghi chu |
|---|:---:|---|
| Hieu nghiep vu SLA/Recovery | 4 | Nam duoc luong risk -> plan -> approve -> execute -> evaluate |
| Thiet ke backend an toan | 4 | Co idempotency, unique index, row lock, audit log |
| Evidence va kha nang defend | 4 | Co reliability snapshot, gate reason va commit/test evidence |
| Su dung AI co kiem soat | 4 | AI ho tro reasoning/action message, backend rule van giu quyet dinh chinh |
| Kiem chung va ghi log | 4 | Co compile pass, commit hash va cap nhat audit/changelog/prompt/reflection |

### 10.9. Huong phat trien tiep theo

- Bo sung test rieng cho duplicate SLA job va row lock recovery plan neu co thoi gian.
- Lam UI evidence snapshot ro hon, co the cho leader click xem snapshot detail.
- Theo doi thuc te neu deploy nhieu backend instance; khi do moi can xem xet distributed lock/Redis/ShedLock cho cac job phan tan.
- Cap nhat AI Audit Log ngay sau moi dot lam viec lon de khong bi don cuoi ky.

---

## 11. Reflection bo sung - Nang cap Outbox Pattern va Admin Job Dashboard

Sau cac chuc nang Task Management va SLA, em tien hanh nang cap kien truc he thong thong qua module Outbox Pattern va Admin Job Dashboard, giup em thuc su cham den "Enterprise-level architecture".

### 11.1. AI da ho tro em o diem nao

AI ho tro em:
- Dua ra ban thiet ke chi tiet tu Database (Flyway) den Frontend (React/Tailwind).
- Trien khai Idempotency bang thuat toan sinh hash (SHA-256).
- Viet `SmartLifecycle` de thuc hien Graceful Shutdown, giup server an toan khi restart.
- Xay dung logic DLQ (Dead Letter Queue) ket hop gui canh bao qua EmailService.
- Thiet ke API va Frontend hien thi Dashboard giam sat toan he thong Outbox va Jobs.
- Viet unit test de cover case duplicate records (DataIntegrityViolationException).

### 11.2. Dieu em thay hay nhat trong phan moi

Dieu hay nhat la viec bien mot chuc nang chay ngầm (Background Job) kho nhin thay va kho debug tro thanh mot cong cu truc quan, the hien 100% tinh minh bach cua he thong. Voi Admin Dashboard, thay vi mo database SQL len check cac job bi loi, gio day Admin chi can nhin UI va bam nut "Retry".

### 11.3. Phan em tu suy nghi va quyet dinh

- Quyet dinh khong dung them thu vien UI moi nao (ant-design, mui, etc.) ma van giu nguyen Tailwind CSS va `axiosInstance` co san, dong nhat voi code hien tai cua project.
- Quyen dinh giu nguyen retry_count bang 0 khi gui lai mot su kien tu DLQ de he thong bat dau mot chu trinh thu lai tiep theo.

### 11.4. Dieu hoc duoc ve he thong phan tan (Distributed Systems)

Em hieu duoc mot kien truc Microservice/Phan tan can phai co:
- **Idempotency:** Request bi trung van xu ly ket qua y het nhau ma khong tao rac.
- **Graceful Shutdown:** Khong giet thread ngay lap tuc khi server down, phai cho thread chay xong nhung gi no dang chay do (hoac trong 1 timeout nhat dinh).
- **Dead Letter Queue (DLQ):** Khi thu nhieu lan ma van chet, dung xoa event ma phai day qua DLQ de phuc hoi (Recover).

### 11.5. Tu danh gia cap nhat cho module nay

| Tieu chi | Diem 1-5 | Ghi chu |
|---|:---:|---|
| Kien truc Outbox/Idempotency | 5 | Hieu ro va ap dung tot Idempotency, DLQ |
| Kien thuc Threading | 4 | Biet su dung SmartLifecycle de dong goi Thread |
| Thiet ke Frontend Admin | 5 | Giao dien truc quan, chuyen nghiep va de quan tri |

---

## 12. Reflection bo sung - Co che Data Synchronization va WebSocket Realtime

Tiep tuc toi uu trai nghiem nguoi dung va dam bao tinh nhat quan du lieu, em xay dung tiep co che Data Synchronization cho he thong de giup cap nhat Frontend theo thoi gian thuc.

### 12.1. AI da ho tro em o diem nao

AI ho tro em:
- Giai doan thiet ke loose coupling: Khuyen nghiem khong dung khoa ngoai cho `EntitySyncLog` ma dung kieu chuoi `entityType` va `entityId` de mo rong cho nhieu thuc the (Task, Sprint, etc).
- Viet Websocket STOMP tu dau (khong dung cac thu vien cồng kềnh ma xai raw `NativeStompClient`).
- Giao tiep STOMP giua Spring Boot (`SimpMessagingTemplate`) va React de hien thi trang thai Sync.
- Tao unit test su dung ArgumentCaptor trong Mockito de chan payload cua websocket.

### 12.2. Dieu em thay hay nhat trong phan moi

Hay nhat la cam giac mang lai duoc mot tinh nang thuong thay o cac app lon (nhu Jira hay Trello) - khi mot nguoi cap nhat Task, tat ca nhung nguoi dang xem chung project tren trinh duyet khac se lap tuc thay bieu tuong "Syncing..." hien len tren Sidebar. No mang lai cam giac "Realtime" thuc su va tich cuc.

### 12.3. Phan em tu suy nghi va quyet dinh

- Quyet dinh tich hop san `NativeStompClient` vao chung hook `useSyncStatus.js` thay vi chia nho thanh context provider giup giam code thua.
- Khong luu tru nguyen toan bo JSON cua Task xuong DB Log ma chi luu `entityId` de cho background job query lai, giup toi uu dung luong DB.

### 12.4. Tu danh gia cap nhat cho module nay

| Tieu chi | Diem 1-5 | Ghi chu |
|---|:---:|---|
| Kien truc Event-Driven | 5 | Ap dung tot ApplicationEventPublisher de tach biet core logic |
| Realtime Websocket | 5 | Hieu kien truc pub/sub cua STOMP |
| Toi uu DB | 5 | Ap dung loose coupling cho DB Logging va Native UPSERT |

---

## 13. Reflection bo sung - Custom System Health Checks and Monitoring

De tang cuong kha nang giam sat (observability) cua du an, em xay dung he thong Custom Health Checks and Job Monitoring.

### 13.1. AI da ho tro em o diem nao

AI ho tro em:
- Trien khai cac buoc tu Database Migration, Entities, Repositories, Services den REST APIs ma khong dung Spring Actuator.
- Xay dung AOP Aspect (`@MonitoredJob`) de tu dong bat cac loi cua job va tracking `consecutiveFailures`.
- Cap nhat React Frontend mot cach truc quan va chuyen nghiep (auto-refresh, skeleton loading).
- Viet unit test de dam bao tinh chinh xac cua Health Checks va Monitoring Aspect.

### 13.2. Dieu em thay hay nhat trong phan moi

Hay nhat la viec tu tay xay dung duoc cac chuc nang giam sat (Disk Space, DB Connection, Memory usage) thay vi su dung cac component tich hop san. Tinh nang giup chu dong gui email thong bao khi he thong hoac job bi loi (Dead Letter) cung mang lai gia tri thuc te cao cho quan tri vien.

### 13.3. Phan em tu suy nghi va quyet dinh

- Quyet dinh reset count (consecutive failures) ve 0 ngay sau khi Job chay success de trang thai on dinh tro lai, khong de cong don lam sai lech.
- Cach ly hoan toan `HealthCheckService` va khong phu thuoc vao Database log services khac de tranh truong hop Circular Failure.
- Add them skeleton loader trong React truoc khi Health data ve.

### 13.4. Tu danh gia cap nhat cho module nay

| Tieu chi | Diem 1-5 | Ghi chu |
|---|:---:|---|
| Kien truc Giam sat (Monitoring) | 5 | Su dung custom solution toi uu thay cho actuator |
| AOP & Annotations | 5 | Hieu kien truc Aspect-Oriented Programming de track log jobs |
| Dashboard UI/UX | 5 | Cap nhat giao dien muot ma, auto-refresh cho Admin |

---

## 14. Reflection bo sung - AI Training Foundation, Sprint Summary va Project Closure

### 14.1. Tong quan giai doan

Trong 3 ngay 25-28/06, em mo rong phan dong gop ra ngoai vung SLA thuan tuy sang 3 nhom chinh: chuan bi nen tang training data cho ML, nang cap bao cao sprint bang AI, va xay dung quy trinh dong project chinh thuc.

### 14.2. AI da ho tro em o diem nao

- Giai thich cach tinh prediction confidence tu zone boundary distance de dam bao co so lieu danh gia do chinh xac cua model sau nay.
- De xuat cau truc sprint narrative 6 tieu chi va member evaluation 4-section de leader nhin duoc tong the va chi tiet.
- De xuat 5 tieu chi do luong khach quan cho danh gia thanh vien, tranh danh gia cam tinh.
- Goi y dung WebSocket broadcast thay vi hardcode wait time, cai thien UX dang ke.
- Thiet ke toan bo quy trinh dong project: pre-check, ARCHIVED lock, quality score, Excel 3 sheet.

### 14.3. Phan em tu suy nghi va quyet dinh

- Tinh Quality Score va Task Points hoan toan rule-based, khong dung AI, de moi nguoi co the tu kiem tra cong thuc khi nhan xet diem.
- Giu "edit-before-ping": leader doc lai AI draft truoc khi gui thong bao den assignee, tranh AI tu dong nhan xet ai do.
- Ma task TSK-NNN tuan tu theo project giup de tra cuu trong Excel export va trong audit log.

### 14.4. Dieu hoc duoc

- Phan biet ro ham du bao (`predictionConfidence`) va ham kiem tra do chinh xac (`predictionAccurate`): hai truong rieng biet, logic rieng biet, khong nen hop nhat.
- WebSocket broadcast la cach thay the don gian cho polling hoac hardcode delay trong nhieu tinh huong.
- Excel Formula Sheet giup nguoi dung kiem tra cong thuc doi chieu, khong can hoi developer — rat quan trong khi project la bai hoc hoc ky.

---

## 15. Reflection bo sung - FastAPI ML Microservice + RAG + RLHF

### 15.1. Tong quan giai doan

Ngay 29/06 la ngay em di vao vung ky thuat sau nhat trong ca project: xay dung ML microservice rieng voi PyTorch va trien khai RAG + RLHF de nang cap chat luong Recovery Plan. Day la lan dau em thuc su build va tich hop mot AI pipeline tu dau den cuoi trong mot project thuc te.

### 15.2. AI da ho tro em o diem nao

- Giai thich loi ich cua viec tach ML ra microservice rieng so voi embed vao Spring Boot (deploy doc lap, train lai khong can restart backend).
- De xuat feature engineering 37 chieu cho SLA risk model, giai thich y nghia tung nhom feature.
- Giai thich RAG voi FAISS va cach inject context vao Gemini prompt de nang chat luong output.
- Giai thich RLHF signal classification va co che rebuild index tu strong signals.
- Canh bao va giai phap cho van de Unicode path tren Windows khi dung FAISS: dung `serialize_index` ra bytes + joblib bundle.

### 15.3. Phan em tu suy nghi va quyet dinh

- Them fallback trong `MlServiceClient`: neu FastAPI khong tra loi trong 3s thi dung rule-based, dam bao he thong khong phu thuoc vao ML service.
- Dat nguong `MIN_SIGNALS = 50` va chi lay `STRONG_POSITIVE` voi `improvement >= 15` de chong model drift tu noise.
- Khong rebuild FAISS theo schedule ma chi rebuild khi du signals, tranh lam index xau di vi du lieu chua du.

### 15.4. Dieu hoc duoc

RAG khong can fine-tune model ma van cai thien dang ke chat luong output chi bang viec inject context dung. RLHF signal tu hanh dong nguoi dung (approve/reject) la nguon label hoan toan tu nhien, khong can to chuc data labeling rieng. Day la thiet ke em danh gia cao nhat trong ca du an vi no tot, re va co the du duy tri.

### 15.5. Han che va huong cai thien

- Model PyTorch hien chi duoc train tren du lieu mock, chua co du lieu thuc tu project thuc te. Can thu thap va relabel sau khi co real data.
- FAISS index chua co co che luu tru lau dai (chi trong saved_models/), neu container restart thi mat index. Can them persistence.
- RLHF buffer hien la in-memory, neu ml-service restart thi mat buffer. Can flush ra file hoac DB.

### 15.6. Tu danh gia cap nhat

| Tieu chi | Diem 1-5 | Ghi chu |
|---|:---:|---|
| Kien truc ML microservice | 5 | Tach biet, co fallback, co Dockerfile |
| Feature engineering | 4 | 37 features co ly, can real data de validate |
| RAG pipeline | 5 | FAISS + sentence-transformers, fix Unicode issue |
| RLHF design | 5 | Signal phan loai ro rang, nguong hop ly |
| Ket hop he thong | 5 | Rule-based + ML + RAG + RLHF trong mot luong lien thong |
