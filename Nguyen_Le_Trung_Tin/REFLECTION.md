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
