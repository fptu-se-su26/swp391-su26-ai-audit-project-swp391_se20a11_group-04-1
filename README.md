# SE AI Audit Project Template

## 1. Project Information

| Item | Description |
|---|---|
| Course | SWP391 |
| Class | SE20A11 |
| Semester | SU26 |
| Group | 4 |
| Topic | An AI-Integrated Project Workspace for IT Student Teams |
| Repository |  |

---

## 2. Team Members

| No | Student ID | Full Name | GitHub Username | Role | Main Responsibility |
|---:|---|---|---|---|---|
| 1 | DE190330 | Phạm Duy Hưng       | hung2689           | Leader | Test Case Management, Bug Tracking, Execution history,  AI Suggest Test Case, Automated Test Execution Flow ,  DB migration (Flyway), Deploy, PR Review & System Architecture |
| 2 | DE190465 | Nguyễn Thành Đạt    | NguyenThanhDat3004 | Member | Auth (JWT, OTP, Redis), Security (RBAC), Workspace & Member Management,  Notification System ,Synchronize project tasks through GitHub Issues|
| 3 | DE190364 | Nguyễn Lê Trung Tín | Tinnguyen13-7      | Member | Task Board (Kanban), Task lifecycle & drag-drop, Evidence Upload, Smart Reminder Mechanism & Anti-Spam Email Solution |
| 4 | DE190313 | Trần Công Tú        | TuTran205          | Member | Requirement Management, Use Case, Requirement status tự động, AI generate requirement, AI generate Use Case, View daily weekly |
| 5 | DE200322 | Nguyễn Minh Hiếu    | hieu2816           | Member | Contribution Analytics Dashboard, Code Insight (GitHub metrics, heatmap), Sprint, Frontend UI components chung, GitHub commit evidence (webhook), Evidence validation flow |

---

## 3. Project Structure

```text
src/
docs/
.github/
README.md
```

---

## 4. Required AI Audit Documents

Each group must maintain the following documents:

```text
docs/AI_AUDIT_LOG.md
docs/PROMPTS.md
docs/REFLECTION.md
docs/CHANGELOG.md
```

---

## 5. Workflow

Students must follow this workflow:

```text
Issue → Branch → Commit → Pull Request → Review → Merge
```

Direct push to the `main` branch should be avoided.

---

## 6. Branch Naming Convention

```text
feature/studentid-task-name
bugfix/studentid-error-name
docs/studentid-update-audit-log
test/studentid-test-case-name
```

Example:

```text
feature/se123456-login-page
bugfix/se123456-login-validation
docs/se123456-update-ai-audit-log
```

---

## 7. Commit Message Convention

```text
[StudentID] type: short description
```

Examples:

```text
[SE123456] feat: add login page
[SE123456] fix: fix login validation
[SE123456] docs: update AI audit log
[SE123456] test: add login test cases
```

Common types:

```text
feat, fix, docs, test, refactor, style, chore
```

---

## 8. How to Run

```text
Students write project running instructions here.
```

---

## 9. AI Usage Rule

Students are allowed to use AI tools such as ChatGPT, Gemini, Claude, GitHub Copilot, Cursor, Antigravity, or similar tools.

However, all important AI usage must be recorded in:

```text
docs/AI_AUDIT_LOG.md
docs/PROMPTS.md
docs/CHANGELOG.md
docs/REFLECTION.md
```

Students must be able to explain, verify, and defend all submitted work.
