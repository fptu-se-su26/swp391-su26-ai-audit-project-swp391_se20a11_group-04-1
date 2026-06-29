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
