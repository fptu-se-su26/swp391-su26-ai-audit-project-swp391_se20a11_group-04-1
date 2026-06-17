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
