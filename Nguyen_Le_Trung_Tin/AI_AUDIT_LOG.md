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
