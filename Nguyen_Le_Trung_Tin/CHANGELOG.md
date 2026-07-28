casi# Changelog - Module 3 Task/Kanban

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

---

## 7. Cap nhat bo sung - Nang cap Outbox Pattern va Admin Job Dashboard

### [25/06/2026] Added

- Them Idempotency Key cho Outbox Pattern bang thuat toan SHA-256.
- Them Graceful Shutdown (SmartLifecycle, GracefulShutdownHandler) de dong goi an toan cac luong bat dong bo trong 25s.
- Them luong Dead Letter Queue (DLQ) cho cac event that bai sau 3 lan retry.
- Them thong bao Email (EmailService) khi mot su kien bi day vao DLQ.
- Them cron job `TaskSlaScheduler` de don dep `processed_events` sau 7 ngay.
- Xay dung 4 REST APIs trong `AdminJobDashboardController` de phuc vu UI (Outbox Stats, DLQ List, Scheduler Logs, DLQ Retry).
- Xay dung `JobDashboardPage.jsx` trong phan Frontend voi React + Tailwind CSS de hien thi dashboard.
- Them unit test `OutboxEventServiceTest.java` (JUnit 5 + Mockito) de kiem tra tinh toan ven cua Idempotency Key va exception `DataIntegrityViolationException`.

### [25/06/2026] Changed

- Update `OutboxPublisherService` de tich hop retry logic, DLQ, Email va SmartLifecycle.
- Cap nhat DB bang Flyway `V20260625000000__upgrade_outbox_pattern.sql`.

### [25/06/2026] Verification

```text
Backend compile: pass (tested local via maven)
Unit tests: pass (OutboxEventServiceTest)
```

---

## 8. Cap nhat bo sung - Co che Data Synchronization va WebSocket Realtime

### [25/06/2026] Added

- Them bang `entity_sync_logs` va `sync_status` su dung loose coupling (luu entityType, entityId thay vi foreign key).
- Tao `SyncTriggerType` enum va `SyncEvent` class (extends ApplicationEvent) de xu ly su kien thay doi trang thai cua Task/Sprint.
- Xay dung `DataSyncService` nhan event bat dong bo, xu ly logic nghiep vu cap nhat Sprint va luu log.
- Tich hop STOMP WebSocket qua `SimpMessagingTemplate` de ban thong bao realtime den topic `/topic/project/{projectId}/sync`.
- Them cron job `DataSyncScheduler` quet dinh ky moi 15 phut de cap nhat trang thai Sprint het han va thu lai cac su kien bi loi (RETRY_PENDING).
- Bo sung 3 endpoint REST API cho trang AdminJobDashboard de quan ly Data Sync Logs.
- Tao `useSyncStatus.js` hook (su dung `NativeStompClient`) va `SyncStatusBadge.jsx` component hien thi trang thai "Syncing..." realtime tren React Sidebar.
- Viet unit test `DataSyncServiceTest.java` (Mockito) kiem tra luong xu ly event va STOMP payload.

### [25/06/2026] Changed

- Modify `TaskServiceImpl` va `SprintServiceImpl` de publish `SyncEvent` sau khi thay doi trang thai.
- Cap nhat DB bang Flyway `V20260626000000__create_data_sync_tables.sql`.

### [25/06/2026] Verification

```text
Backend compile: pass (tested local via maven)
Unit tests: pass (DataSyncServiceTest)
```

---

## 9. Cap nhat bo sung - Custom System Health Checks and Job Monitoring

### [25/06/2026] Added

- Them table `system_health_checks` va `monitored_job_stats` bang Flyway migration.
- Tao entity `SystemHealthCheck`, `MonitoredJobStat` va cac repository tuong ung.
- Them `monitoringExecutor` vao `AsyncConfig` va cap nhat `GracefulShutdownHandler`.
- Xay dung `@MonitoredJob` annotation va `MonitoringAspect` de tu dong luu log va dem so lan that bai (reset thanh 0 khi thanh cong).
- Them `HealthCheckService` de kiem tra Database, Disk, va Memory.
- Them `MonitoringAlertService` de gui email canh bao khi health check that bai hoac job that bai lien tuc.
- Them `SystemMonitorScheduler` chay dinh ky (5 phut/lan) de update health status.
- Mo rong `AdminJobDashboardController` voi 3 API quan ly Health Summary, Live Health Check va Job Stats.
- Cap nhat React Frontend `JobDashboardPage.jsx`, them section "System Health & Monitoring" de hien thi banner, card components va table quan ly job stats.
- Them unit tests cho `HealthCheckService` va `MonitoringAspect`.

### [25/06/2026] Verification

```text
Backend compile: pass (tested local via maven)
Unit tests: pass (HealthCheckServiceTest, MonitoringAspectTest)
```

---

## 10. Cap nhat bo sung - AI Training Foundation va AI Sprint Summary

### [25/06/2026] Added - AI Training Foundation

- Them `predictionConfidence` vao `SlaRiskAssessmentService` tinh tu khoang cach score den zone boundary.
- Them `predictionConfidence` luu vao `task_sla_states`.
- Them buoc backfill `predictionAccurate` trong `DataSyncScheduler` khi sprint auto-complete.
- Them `projectId` vao `AuditLog`, extract tu request URI bang regex.
- Migration `V20260630000000`: `ALTER TABLE audit_logs ADD project_id`, `CREATE VIEW v_member_ai_features` join `weekly_report_members` + `task_sla_states`.

### [26/06/2026] Added - AI Sprint Completion Summary

- Tao entity `SprintCompletionSummary`, repository, `SprintCompletionService`.
- Migration `V20260627000001__add_sprint_completion_summary.sql`.
- `GeminiSprintNarrativeService` sinh narrative 6 tieu chi: Goal/Delivery/Quality/Teamwork/Process/Improvement.
- Trigger `generate()` trong `SprintServiceImpl.updateSprintStatus()` khi sprint → COMPLETED, chi generate mot lan.
- `DataSyncScheduler` backfill cho sprint da COMPLETED chua co summary.
- `GeminiMemberNarrativeService` sinh member evaluation 4-section: Performance Summary, Strengths, Areas for Improvement, Potential Risks.
- Cap nhat `SlaPingService` su dung 4-section format.
- Frontend `SprintHealthModal` render section cards mau sac.
- `ReliabilityDashboardPage` Gemini narrative hien thi tren metric charts.
- `JobDashboardPage` map Actuator status sang HEALTHY/DEGRADED/DOWN badges.

---

## 11. Cap nhat bo sung - 5-criteria Evaluation, Project Closure va Excel Export

### [28/06/2026] Added - 5-criteria Member Evaluation + WebSocket

- 5-criteria assessment per member: delivery reliability, task weight, proactiveness, priority handling, workload volume.
- Cap nhat `GeminiMemberNarrativeService`: prompt ngan 2 cau, max 35 tu, goi ten truc tiep, tranh ngon ngu chung chung.
- Them `broadcastSprintAiDone` trong `WebSocketBroadcastService`.
- Frontend `SprintReportPage` lang nghe WebSocket thay vi hardcode 60s countdown.
- `SprintReportResult` collapse/expand AI comment theo tung thanh vien.

### [28/06/2026] Added - Project Closure + Quality Score + Excel Export

- Them trang thai ARCHIVED cho Project, khoa toan bo CRUD khi ARCHIVED.
- Them reopen (ARCHIVED → ACTIVE) voi ly do ghi AuditLog.
- Pre-close check: task chua DONE, bug chua closed, sprint chua COMPLETED.
- Xu ly task con do: CANCEL_ALL hoac MOVE_TO_PROJECT.
- Open bugs auto-close khi project dong.
- Auto-assign ma task tuan tu: TSK-001, TSK-002 theo project.
- Auto-track `actualHours` va `qualityScore` khi task → DONE.
- Quality Score (1-10): graduated deadline penalty + SLA penalty.
- Task Points = Weight x Priority Factor x (Quality/10).
- `ProjectTrackingExportService`: Excel 3 sheet (Tasks by sprint/member, Member Summary, Formula).
- `ProjectClosureModal.jsx`: wizard 4 buoc (kiem tra → xu ly task → ly do → xac nhan).
- `DashboardPage`: nut Export Tracking / Close Project / Reopen cho Leader/Mentor.
- BugReport lock khi project ARCHIVED.
- Real-time SYSTEM notification den tat ca thanh vien khi dong project.
- `PROJECT_CLOSED` outbox event.
- Migration `V20260628000002__project_closure_and_task_tracking.sql`.

### [28/06/2026] Verification

```text
Backend compile: pass
Frontend build: pass
```

---

## 12. Cap nhat bo sung - FastAPI ML Microservice + RAG + RLHF

### [29/06/2026] Added - FastAPI ML Microservice

- Tao thu muc `ml-service/` FastAPI port 8001.
- PyTorch `MultiTaskSLAModel`: 37 features, 3 output heads (risk classification/penalty regression/recovery priority), 86.5% accuracy.
- Endpoint `/predict/sla-risk`, `/predict/sprint-health`, `/detect/anomaly`.
- `MlFeatureBuilder.java` chuan bi vector 37 chieu tu task data.
- `MlServiceClient.java` goi HTTP voi fallback rule-based neu service down.
- Doi ten SLA risk levels: NORMAL→HEALTHY, LOW→ON_TRACK, MEDIUM→AT_RISK, HIGH→WARNING, CRITICAL→BREACH.
- Migration `V20260628000002`: rename risk level data cu.
- Alert cooldown 1h trong `SystemMonitorScheduler`.
- Dockerfile + docker-compose service cho ml-service.

### [29/06/2026] Added - RAG context injection + RLHF feedback loop

- `ml-service/app/rag/embedder.py`: sentence-transformers `all-MiniLM-L6-v2`, 384-dim.
- `ml-service/app/rag/faiss_store.py`: FAISS IndexFlatL2, serialize_index bytes + joblib bundle (fix Unicode path Windows).
- `ml-service/app/rag/build_index.py`: build index tu 500 recovery plans.
- Endpoint `/recovery/similar` tim top-k plan tuong tu bang FAISS.
- Endpoint `/recovery/generate-plan` la flow AI Recovery Plan chinh: Spring Boot `MlServiceClient` goi FastAPI ML Service, FastAPI inject RAG context roi goi Ollama/Gemini.
- Endpoint `/feedback/signal` nhan RLHF signal tu Spring Boot.
- Endpoint `/train/trigger`, `/train/status` quan ly rebuild FAISS async.
- `GeminiRecoveryService.generateWithRagContext()` chi la legacy/deprecated direct-Gemini path, khong con la flow chinh cua Recovery Plan.
- Hook RLHF signal vao `RecoveryPlanService` tai approve/reject/gate_result.
- Auto-rebuild FAISS khi buffer >= 50 STRONG_POSITIVE signals co improvement >= 15.

### [29/06/2026] Verification

```text
Backend compile: pass (mvnw.cmd -DskipTests compile)
ML service: FastAPI docs accessible at localhost:8001/docs
```
