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
