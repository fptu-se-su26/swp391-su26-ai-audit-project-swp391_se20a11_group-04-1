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

---

## 6. Cap nhat bo sung - Adaptive Recovery, Reliability Monitoring va Evidence Gate

### [12-13/06/2026] Added

- Them Human-in-the-loop Recovery Plan backend flow:
  - Generate recovery plan tu SLA risk.
  - Leader/Mentor approve hoac reject.
  - Execute safe actions sau khi duyet.
  - Audit log cho generate/approve/reject/execute/action.
- Them cac bang/backend component chinh:
  - `recovery_plans`.
  - `recovery_plan_actions`.
  - `recovery_plan_audit_logs`.
  - `RecoveryPlanService`.
  - `RecoveryPlanController`.
- Them partial unique index `uk_active_recovery_plan_per_task` de tranh tao nhieu active recovery plan cho cung mot task.
- Them tai lieu local:
  - `Tin/recovery_plan_backend_flow_changes.md`
  - `Tin/SLA_LEVEL5_AI_RECOVERY_IDEA.md`

### [18/06/2026] Added

- Them Adaptive AI Recovery Loop:
  - Gemini co the de xuat `selectedActions`.
  - Backend validate action theo whitelist truoc khi tao action that.
  - Neu AI tra action khong hop le thi fallback ve rule-based actions.
- Them follow-up plan sau execution:
  - Scheduler kiem tra hieu qua sau 24h.
  - Neu plan khong hieu qua thi mark `DECLINED`, notify leader va tao follow-up plan.
  - Guard de khong tao follow-up qua nhieu trong cung task/sprint.
- Them Hybrid Rule-based SLA Scoring:
  - burn rate.
  - SPI.
  - predicted risk level.
  - prediction reasons.
  - score breakdown.
- Cap nhat Decision Pack UI de hien thi burn rate, SPI, predicted risk va score breakdown.
- Them tai lieu local:
  - `Tin/SLA_ADAPTIVE_AI_AND_HYBRID_SCORING_20260618.md`

### [19/06/2026] Added

- Them SLA Reliability Monitoring:
  - Reliability snapshot theo project/sprint.
  - MTTR.
  - MTBF.
  - Availability.
  - Error Budget.
  - Gemini narrative cho reliability report.
- Them Async SLA Analysis Job:
  - Tao job refresh reliability.
  - Poll job status tu frontend.
  - Tra report khi job `DONE`.
- Them frontend:
  - `ReliabilityDashboardPage.jsx`.
  - `SchedulerJobsPage.jsx`.
  - cac component chart/card cho reliability.

### [19/06/2026] Changed

- Recovery Plan effectiveness check khong chi luu score before/after nua, ma con capture evidence snapshot.
- Them `evidenceSnapshotId` vao Recovery Plan response/UI.
- Them `gateResult` va `gateReason` de tach:
  - `status`: process state (`EXECUTED`, `DECLINED`, ...)
  - `gateResult`: outcome verdict (`PASSED`, `FAILED`, `INSUFFICIENT_DATA`)
- Frontend Recovery Plan Dashboard hien gate result card, score before -> after va link sang reliability.

### [19/06/2026] Fixed

- Fix duplicate SLA Analysis Job:
  - Neu da co job `PENDING/RUNNING` cung project/sprint thi tra ve job cu.
  - Them DB unique partial index cho active job:
    - `uk_active_sla_analysis_job_per_sprint`
  - Catch duplicate race condition va tra ve job dang chay thay vi loi 500.
- Them row lock cho Recovery Plan approve/reject/execute:
  - `findByIdForUpdate()`.
  - `LockModeType.PESSIMISTIC_WRITE`.
- Fix Flyway migration local bi loi duplicate table/column:
  - `CREATE TABLE IF NOT EXISTS`.
  - `ADD COLUMN IF NOT EXISTS`.

### [19/06/2026] Verification

```text
Backend compile: mvnw.cmd -DskipTests compile
Ket qua: pass
```

Ghi chu:

- `clean compile` bi fail do file jar trong `target` dang bi backend process giu, khong phai loi compile code.

### Commit lien quan

- `8d690a8` - merge latest `origin/develop`.
- `8db5058` - `[DE190364] feat: add SLA reliability monitoring`.
- `f5ec7f6` - `[DE190364] feat: add recovery plan evidence gate`.
- `ae2dfc1` - `[DE190364] fix: make migrations idempotent`.
