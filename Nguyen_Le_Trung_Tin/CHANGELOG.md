# Changelog - Module 3 Task/Kanban

## 1. Thong tin

| Thong tin | Noi dung |
|---|---|
| Sinh vien | Nguyen Le Trung Tin |
| MSSV | DE190364 |
| Module | Module 3 - Task/Kanban Management |
| Branch | feature/de190364-task-crud |
| Thoi gian | 21/05/2026 - 22/05/2026 |
| Commit | - [feat(task): implement kanban task management](https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/7acf2fe25519c9564ff0580580eff6b2eff83390)<br>- [complete crud task](https://github.com/fptu-se-su26/swp391-su26-ai-audit-project-swp391_se20a11_group-04-1/commit/69982bd62b7540b48719dbd56b54a2be52e16f83) |

## 2. Cac thay doi chinh

### Frontend

- Them module `features/kanban`.
- Them cac component:
  - `KanbanHeader.jsx`
  - `KanbanFilters.jsx`
  - `KanbanColumn.jsx`
  - `TaskCard.jsx`
  - `TaskDetailDrawer.jsx`
  - `TaskFormModal.jsx`
- Them cac page:
  - `KanbanBoardPage.jsx`
  - `TaskDetailPage.jsx`
  - `MyTasksPage.jsx`
- Them Zustand store:
  - `store/useKanbanStore.js`
- Them service goi API:
  - `services/taskService.js`
- Them mapper:
  - `utils/taskMapper.js`
- Them keo tha task giua cac cot Kanban.
- Them thao tac create/edit/delete task.
- Them kebab menu tren task card de sua/xoa task.
- Them drawer xem nhanh task.
- Them trang full detail cho task.
- Them nut thu gon tu full detail ve drawer/panel.
- Them My Tasks vao sidebar.
- Sua route sai `/task-board` thanh `/kanban`.
- Luu `activeProject` vao localStorage de reload khong mat workspace sidebar.

### Backend

- Them `TaskController.java`.
- Them DTO:
  - `TaskRequest.java`
  - `TaskResponse.java`
  - `TaskStatusUpdateRequest.java`
  - `TaskAssigneeUpdateRequest.java`
- Them entity:
  - `Task.java`
  - `TaskChecklist.java`
  - `TaskStatus.java`
  - `TaskType.java`
  - `Priority.java`
- Them repository:
  - `TaskRepository.java`
  - `TaskChecklistRepository.java`
- Them service:
  - `TaskService.java`
  - `TaskServiceImpl.java`
- Them cac API:
  - `GET /api/v1/projects/{projectId}/tasks`
  - `POST /api/v1/projects/{projectId}/tasks`
  - `GET /api/v1/tasks/{taskId}`
  - `PUT /api/v1/tasks/{taskId}`
  - `DELETE /api/v1/tasks/{taskId}`
  - `PATCH /api/v1/tasks/{taskId}/status`
  - `PATCH /api/v1/tasks/{taskId}/assignee`
  - `GET /api/v1/my-tasks`

### Git va convention

- Doi branch thanh `feature/de190364-task-crud`.
- Doi folder goi API Kanban thanh `features/kanban/services`.
- Cap nhat `.gitignore` de tranh push file local/nham cho:
  - `/package-lock.json`
  - `/code/KANBAN_UPGRADE_PLAN.md`
  - `/code/.gitignore`

## 3. Kiem tra da thuc hien

```text
Backend build: .\mvnw.cmd -q -DskipTests package
Frontend build: npm.cmd run build
Ket qua: pass
```

## 4. Ghi chu

- Database migration da co san bang `tasks`, `task_assignees`, `task_checklists`, nen khong tao migration moi.
- Neu database local chua co project/member/task thi can seed data de test UI Kanban voi du lieu that.
- File `application.yaml` la config local va khong duoc push.

---

## 5. Cap nhat bo sung - Task SLA, Daily Digest, Sprint Report va Event-driven SLA

### [27/05/2026] Added

- Phan tich va thiet ke huong Task SLA cho task co deadline, assignee, evidence va penalty.
- Dinh huong Daily Digest de gom cac task can nhac vao email theo ngay, tranh spam email rieng le.
- Xac dinh cac thanh phan backend can co: SLA rule, scheduler, digest, email log, penalty log va outbox event.
- Ghi nhan folder tao migration DB: `code/backend/src/main/resources/db/migration`.

### [28/05/2026] Changed

- Ra soat phan Task SLA, Daily Digest va Weekly Report.
- Dieu chinh UI report giu ngon ngu mac dinh la English.
- Bo sung xu ly layout de khi Google Translate dich sang tieng Viet khong lam vo giao dien.

### [29/05/2026] Added

- Dinh huong giao dien report theo dashboard:
  - Metric cards.
  - Member status/risk.
  - SLA flags.
  - Scheduler/outbox panel.
  - Weekly/Sprint report summary.
- Them huong Kafka realtime notification:
  - Kafka publisher gui envelope co `eventType` va `payload`.
  - Kafka consumer lang nghe task/notification/sla/email topics.
  - WebSocket push event den user.

### [08/06/2026] Added

- Tao tai lieu tong hop dong gop:
  - `Tin/SPRINT_REPORT_SLA_NOTIFICATION_CONTRIBUTION.md`
- Ghi lai cac phan Sprint Report, SLA backend/frontend, notification WebSocket, email va dieu huong notification.

### [10/06/2026] Added

- Implement/ra soat Event-driven SLA:
  - `SlaEventConsumer`.
  - `SlaStateService`.
  - `TaskSlaState`.
  - `SlaDecisionLog`.
  - Repository cho SLA state/log.
  - Migration `V20260610170000__add_task_sla_state_engine.sql`.
- Them event khi task/evidence thay doi de re-evaluate SLA.
- Them daily recheck va urgent recheck luc 17:00.

### [10/06/2026] Changed

- Nang cap Daily Digest/SLA Reminder theo project isolation:
  - `DailyDigest` co `project_id`.
  - Unique key theo `user_id + project_id + digest_date + digest_type`.
  - Query task SLA theo project.
  - Endpoint test trigger theo project.
  - Frontend truyen `activeProject.id` khi chay thu reminder.
- Tao tai lieu:
  - `Tin/PROJECT_ISOLATED_DAILY_DIGEST.md`
  - `Tin/SLA_EVENT_DRIVEN_COMPLETION.md`
  - `Tin/SLA_LEVEL5_EVOLUTION_JOURNEY.md`

### [11/06/2026] Added

- Them Full SLA Core action log:
  - `SlaActionLog`.
  - `SlaActionLogRepository`.
  - Migration `V20260610190000__add_sla_action_logs.sql`.
- Them `action_key` de chong spam/action lap theo:
  - projectId
  - taskId
  - recipient/system
  - actionType
  - slaCategory
  - date
- Them SLA Decision Pack:
  - `SlaDecisionPackController`.
  - `SlaDecisionPackService`.
  - `SlaDecisionPackResponse`.
  - `SlaDecisionPackPanel.jsx`.

### [11/06/2026] Fixed

- Bo duplicate check dua tren notification title trong `SlaActionService` cho assignee reminder.
- Su dung `action_key` lam co che chong spam chinh:
  - Cung ngay/cung category thi khong gui lai.
  - Khac ngay hoac khac category thi duoc gui neu task van con risk.

### [11/06/2026] Verification

```text
Backend compile: pass
Frontend build: pass
```
