# Database Schema Context — Project Management System

## Tổng quan
Hệ thống quản lý dự án học thuật gồm **26 bảng**, **30+ ENUM types**, chia làm **8 nhóm chức năng**.

---

## ENUM Types quan trọng

```
project_type_enum      : WEB_APP | MOBILE | DATABASE | RESEARCH | OTHER
project_status_enum    : PLANNING | ACTIVE | IN_REVIEW | COMPLETED | ARCHIVED
sprint_status_enum     : PLANNED | ACTIVE | COMPLETED
requirement_type_enum  : FUNCTIONAL | NON_FUNCTIONAL
priority_enum          : CRITICAL | HIGH | MEDIUM | LOW
requirement_status_enum: DRAFT | IN_PROGRESS | IN_REVIEW | DONE | DEPRECATED
task_type_enum         : DEVELOPMENT | TESTING | DOCUMENTATION | UI_UX | RESEARCH | DEPLOYMENT | BUG_FIX | REVIEW
task_status_enum       : TODO | IN_PROGRESS | IN_REVIEW | DONE | BLOCKED
test_type_enum         : UNIT | INTEGRATION | UI | API | MANUAL
test_case_status_enum  : NOT_RUN | PASS | FAIL | BLOCKED
test_execution_status_enum: PASS | FAIL | BLOCKED
environment_enum       : DEV | STAGING
bug_severity_enum      : CRITICAL | HIGH | MEDIUM | LOW
bug_status_enum        : OPEN | IN_PROGRESS | FIXED | VERIFIED | CLOSED | REOPENED
evidence_type_enum     : SCREENSHOT | SCREEN_RECORDING | GITHUB_COMMIT | API_RESPONSE | FIGMA_LINK | TEST_RESULT | DB_DIAGRAM | DEPLOY_LINK | SURVEY | DOCUMENT
evidence_status_enum   : PENDING | AUTO_CHECKED | ACCEPTED | REJECTED | NEEDS_CLARIFICATION
evidence_entity_type_enum : REQUIREMENT | TASK | TEST_CASE | BUG_REPORT | SPRINT
ai_generation_type_enum: GENERATE_TASK | SUGGEST_TEST | WEEKLY_REPORT | REQUIREMENT_IMPORT | MISSING_ARTIFACT | CONTRIBUTION_SUMMARY
mentor_comment_entity_type_enum: REQUIREMENT | WEEKLY_REPORT | TASK
notification_type_enum : TASK_ASSIGNED | TASK_COMMENTED | DEADLINE_NEAR | TEST_FAILED | AI_ALERT | MENTOR_COMMENT
```

---

## Nhóm 1: Auth & User

### system_roles
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| name | VARCHAR(50) UNIQUE | tên role hệ thống |
| description | VARCHAR(255) | |

### project_roles
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| name | VARCHAR(50) UNIQUE | tên role trong project |
| description | VARCHAR(255) | |

### user_accounts
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| username | VARCHAR(50) UNIQUE | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR | |
| system_role_id | BIGINT FK → system_roles.id | |
| is_active | BOOLEAN DEFAULT TRUE | |
| created_at / updated_at | TIMESTAMP | |

### user_profiles
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| user_id | BIGINT FK → user_accounts.id (UNIQUE, CASCADE DELETE) | quan hệ 1-1 với user_accounts |
| full_name | VARCHAR(100) | |
| avatar_url | VARCHAR | |
| bio | TEXT | |
| phone | VARCHAR(20) | |
| updated_at | TIMESTAMP | |

**Quan hệ:**
- `user_accounts` →(1-1)→ `user_profiles` (qua user_profiles.user_id)
- `user_accounts` →(N-1)→ `system_roles` (qua user_accounts.system_role_id)

---

## Nhóm 2: Project & Sprint

### academic_contexts
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| subject | VARCHAR(100) | tên môn học |
| semester | VARCHAR(20) | học kỳ |
| academic_year | VARCHAR(10) | năm học |
| UNIQUE | (subject, semester, academic_year) | |

### projects
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| name | VARCHAR(100) | |
| description | TEXT | |
| type | project_type_enum | |
| academic_context_id | BIGINT FK → academic_contexts.id | nullable |
| start_date | DATE | nullable |
| deadline | DATE | bắt buộc |
| status | project_status_enum DEFAULT 'PLANNING' | |
| color | VARCHAR(7) | mã hex màu |
| avatar_url | VARCHAR | |
| created_by | BIGINT FK → user_accounts.id | |
| created_at / updated_at | TIMESTAMP | |

### project_members
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| user_id | BIGINT FK → user_accounts.id | |
| project_role_id | BIGINT FK → project_roles.id | |
| joined_at | TIMESTAMP | |
| invited_by | BIGINT FK → user_accounts.id (nullable) | |
| UNIQUE | (project_id, user_id) | 1 user chỉ vào 1 project 1 lần |

### invitation_links
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| token | VARCHAR(64) UNIQUE | |
| project_role_id | BIGINT FK → project_roles.id | role sẽ được gán khi dùng link |
| expires_at | TIMESTAMP | |
| created_by | BIGINT FK → user_accounts.id | |
| used_by | BIGINT FK → user_accounts.id (nullable) | ai đã dùng link |
| used_at | TIMESTAMP (nullable) | |

### sprints
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| name | VARCHAR(100) | |
| goal | TEXT (nullable) | mục tiêu sprint |
| start_date | DATE | |
| end_date | DATE | CHECK end_date >= start_date |
| status | sprint_status_enum DEFAULT 'PLANNED' | |
| created_at | TIMESTAMP | |

### rtm_snapshots
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| sprint_id | BIGINT FK → sprints.id (CASCADE DELETE) | |
| snapshot_data | JSONB | toàn bộ trạng thái RTM tại thời điểm đó |
| created_at | TIMESTAMP | |

### shareable_links
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| created_by | BIGINT FK → user_accounts.id | |
| token | VARCHAR(64) UNIQUE | |
| expires_at | TIMESTAMP (nullable) | null = không hết hạn |
| created_at | TIMESTAMP | |

**Quan hệ:**
- `projects` →(1-N)→ `sprints`
- `projects` →(1-N)→ `project_members` ←(N-1)← `user_accounts`
- `projects` →(1-N)→ `invitation_links`
- `projects` →(1-N)→ `rtm_snapshots` ←(N-1)← `sprints`
- `projects` →(N-1)→ `academic_contexts`

---

## Nhóm 3: Requirement & Use Case

### requirements
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| title | VARCHAR(200) | |
| description | TEXT (nullable) | |
| type | requirement_type_enum | FUNCTIONAL hoặc NON_FUNCTIONAL |
| priority | priority_enum | CRITICAL/HIGH/MEDIUM/LOW |
| acceptance_criteria | JSONB | danh sách tiêu chí nghiệm thu |
| owner_id | BIGINT FK → user_accounts.id (nullable) | người chịu trách nhiệm |
| status | requirement_status_enum DEFAULT 'DRAFT' | |
| evidence_required | BOOLEAN DEFAULT FALSE | có cần nộp bằng chứng không |
| req_order | INT (nullable) | thứ tự hiển thị |
| created_by | BIGINT FK → user_accounts.id | |
| created_at / updated_at | TIMESTAMP | |

### requirement_tags
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| requirement_id | BIGINT FK → requirements.id (CASCADE DELETE) | |
| tag | VARCHAR(50) | nhãn tự do, VD: "auth", "payment" |
| UNIQUE | (requirement_id, tag) | |

### use_cases
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| requirement_id | BIGINT FK → requirements.id (CASCADE DELETE) | |
| name | VARCHAR(200) | tên kịch bản |
| precondition | TEXT (nullable) | điều kiện trước |
| postcondition | TEXT (nullable) | kết quả sau |
| main_flow | JSONB | các bước chính theo thứ tự |
| alternative_flow | JSONB (nullable) | luồng ngoại lệ |
| created_by | BIGINT FK → user_accounts.id | |
| created_at / updated_at | TIMESTAMP | |

### use_case_actors
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| use_case_id | BIGINT FK → use_cases.id (CASCADE DELETE) | |
| actor_name | VARCHAR(100) | VD: "Admin", "Guest", "System" |

**Quan hệ:**
- `projects` →(1-N)→ `requirements`
- `requirements` →(1-N)→ `requirement_tags`
- `requirements` →(1-N)→ `use_cases`
- `use_cases` →(1-N)→ `use_case_actors`

---

## Nhóm 4: Task

### tasks
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| requirement_id | BIGINT FK → requirements.id (SET NULL on delete, nullable) | task thuộc requirement nào |
| sprint_id | BIGINT FK → sprints.id (SET NULL on delete, nullable) | task thuộc sprint nào |
| title | VARCHAR(200) | |
| description | TEXT (nullable) | |
| type | task_type_enum | |
| primary_assignee_id | BIGINT FK → user_accounts.id (nullable) | người phụ trách chính |
| priority | priority_enum | |
| deadline | DATE (nullable) | |
| estimated_hours | DECIMAL(5,1) (nullable) | giờ ước tính |
| status | task_status_enum DEFAULT 'TODO' | |
| blocked_reason | TEXT (nullable) | lý do bị blocked |
| created_by | BIGINT FK → user_accounts.id | |
| created_at / updated_at | TIMESTAMP | |

### task_assignees
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| task_id | BIGINT FK → tasks.id (CASCADE DELETE) | |
| user_id | BIGINT FK → user_accounts.id | |
| PRIMARY KEY | (task_id, user_id) | bảng N-N, 1 task nhiều người làm |

### task_checklists
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| task_id | BIGINT FK → tasks.id (CASCADE DELETE) | |
| content | VARCHAR(500) | nội dung việc cần làm |
| is_done | BOOLEAN DEFAULT FALSE | |
| order_index | INT DEFAULT 0 | thứ tự hiển thị |

### task_dependencies
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| blocking_task_id | BIGINT FK → tasks.id (CASCADE DELETE) | task đang chặn |
| blocked_task_id | BIGINT FK → tasks.id (CASCADE DELETE) | task bị chặn |
| PRIMARY KEY | (blocking_task_id, blocked_task_id) | |
| CHECK | blocking_task_id <> blocked_task_id | không tự block mình |

**Quan hệ:**
- `projects` →(1-N)→ `tasks`
- `requirements` →(1-N)→ `tasks` (nullable)
- `sprints` →(1-N)→ `tasks` (nullable)
- `tasks` →(N-N)→ `user_accounts` qua `task_assignees`
- `tasks` →(1-N)→ `task_checklists`
- `tasks` →(N-N)→ `tasks` qua `task_dependencies` (tự tham chiếu)

---

## Nhóm 5: Test & Bug

### test_cases
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| requirement_id | BIGINT FK → requirements.id (CASCADE DELETE) | |
| title | VARCHAR(200) | |
| type | test_type_enum | UNIT/INTEGRATION/UI/API/MANUAL |
| precondition | TEXT (nullable) | |
| expected_result | TEXT | kết quả mong đợi |
| status | test_case_status_enum DEFAULT 'NOT_RUN' | |
| created_by | BIGINT FK → user_accounts.id | |
| created_at / updated_at | TIMESTAMP | |

### test_steps
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| test_case_id | BIGINT FK → test_cases.id (CASCADE DELETE) | |
| step_number | INT | thứ tự bước |
| description | TEXT | mô tả bước |
| UNIQUE | (test_case_id, step_number) | |

### test_executions
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| test_case_id | BIGINT FK → test_cases.id (CASCADE DELETE) | |
| executed_by | BIGINT FK → user_accounts.id | |
| executed_at | TIMESTAMP | |
| status | test_execution_status_enum | PASS/FAIL/BLOCKED |
| actual_result | TEXT (nullable) | kết quả thực tế |
| environment | environment_enum | DEV hoặc STAGING |

### bug_reports
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| test_execution_id | BIGINT FK → test_executions.id (SET NULL, nullable) | bug phát hiện qua lần chạy test nào |
| title | VARCHAR(200) | |
| description | TEXT (nullable) | |
| severity | bug_severity_enum | CRITICAL/HIGH/MEDIUM/LOW |
| environment | environment_enum (nullable) | |
| steps_to_reproduce | JSONB (nullable) | |
| expected_result | TEXT (nullable) | |
| actual_result | TEXT (nullable) | |
| status | bug_status_enum DEFAULT 'OPEN' | |
| assigned_to | BIGINT FK → user_accounts.id (nullable) | |
| fix_commit_hash | VARCHAR(40) (nullable) | SHA commit đã fix |
| related_task_id | BIGINT FK → tasks.id (SET NULL, nullable) | |
| created_by | BIGINT FK → user_accounts.id | |
| created_at / updated_at | TIMESTAMP | |

**Quan hệ:**
- `requirements` →(1-N)→ `test_cases`
- `test_cases` →(1-N)→ `test_steps`
- `test_cases` →(1-N)→ `test_executions`
- `test_executions` →(1-N)→ `bug_reports` (nullable)
- `bug_reports` →(N-1)→ `tasks` (nullable)

---

## Nhóm 6: Evidence

### evidence
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| uploaded_by | BIGINT FK → user_accounts.id | |
| type | evidence_type_enum | loại bằng chứng |
| title | VARCHAR(200) | |
| description | TEXT (nullable) | |
| file_url | VARCHAR (nullable) | nếu upload file |
| external_url | VARCHAR (nullable) | nếu là link ngoài (GitHub, Figma...) |
| metadata | JSONB (nullable) | thông tin bổ sung |
| status | evidence_status_enum DEFAULT 'PENDING' | |
| reviewed_by | BIGINT FK → user_accounts.id (nullable) | mentor đã review |
| reviewed_at | TIMESTAMP (nullable) | |
| created_at | TIMESTAMP | |

### evidence_links
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| evidence_id | BIGINT FK → evidence.id (CASCADE DELETE) | |
| entity_type | evidence_entity_type_enum | REQUIREMENT/TASK/TEST_CASE/BUG_REPORT/SPRINT |
| entity_id | BIGINT | ID của entity tương ứng |
| linked_at | TIMESTAMP | |
| UNIQUE | (evidence_id, entity_type, entity_id) | |

> **Lưu ý:** `evidence_links` dùng kiểu polymorphic — không có FK cứng vào từng bảng. `entity_type` xác định bảng nào, `entity_id` là ID trong bảng đó.

**Quan hệ:**
- `evidence` →(1-N)→ `evidence_links`
- `evidence_links` →(polymorphic)→ `requirements` | `tasks` | `test_cases` | `bug_reports` | `sprints`

---

## Nhóm 7: AI & Reporting

### ai_generation_cache
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| type | ai_generation_type_enum | loại yêu cầu AI |
| input_hash | VARCHAR(64) | hash của input để tránh gọi lại |
| input_data | JSONB | dữ liệu đầu vào gốc |
| output_data | JSONB | kết quả AI trả về |
| model_used | VARCHAR(50) | tên model AI |
| tokens_used | INT (nullable) | |
| created_at | TIMESTAMP | |
| expires_at | TIMESTAMP | thời điểm cache hết hạn |
| UNIQUE | (type, input_hash) | cache theo loại + nội dung |

### weekly_reports
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| sprint_id | BIGINT FK → sprints.id (SET NULL, nullable) | |
| week_number | INT | tuần thứ mấy |
| generated_by | BIGINT FK → user_accounts.id (nullable) | null nếu AI tự sinh |
| content_markdown | TEXT | nội dung báo cáo |
| input_snapshot | JSONB | dữ liệu đầu vào lúc sinh báo cáo |
| created_at | TIMESTAMP | |

### mentor_comments
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| commenter_id | BIGINT FK → user_accounts.id | |
| entity_type | mentor_comment_entity_type_enum | REQUIREMENT/WEEKLY_REPORT/TASK |
| entity_id | BIGINT | ID của entity được comment |
| content | TEXT | |
| created_at / updated_at | TIMESTAMP | |

> `mentor_comments` cũng dùng polymorphic như `evidence_links`.

### notifications
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| user_id | BIGINT FK → user_accounts.id (CASCADE DELETE) | người nhận |
| project_id | BIGINT FK → projects.id (CASCADE DELETE, nullable) | |
| type | notification_type_enum | |
| title | VARCHAR(200) | |
| message | TEXT (nullable) | |
| entity_type | VARCHAR(50) (nullable) | bảng liên quan |
| entity_id | BIGINT (nullable) | ID liên quan |
| is_read | BOOLEAN DEFAULT FALSE | |
| created_at | TIMESTAMP | |

---

## Nhóm 8: GitHub / Code Insight

### github_integrations
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (UNIQUE, CASCADE DELETE) | 1 project chỉ 1 repo |
| repo_owner | VARCHAR(100) | tên tổ chức/user trên GitHub |
| repo_name | VARCHAR(100) | tên repo |
| access_token_encrypted | TEXT | token đã mã hoá |
| webhook_secret | VARCHAR | |
| connected_at | TIMESTAMP | |
| connected_by | BIGINT FK → user_accounts.id | |

### commit_metrics
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| project_id | BIGINT FK → projects.id (CASCADE DELETE) | |
| user_id | BIGINT FK → user_accounts.id (nullable) | null nếu chưa map được GitHub user |
| github_username | VARCHAR(100) | username GitHub gốc |
| commit_sha | VARCHAR(40) UNIQUE | |
| commit_message | TEXT | |
| committed_at | TIMESTAMP | |
| files_changed | INT (nullable) | |
| lines_added | INT (nullable) | |
| lines_deleted | INT (nullable) | |
| task_id | BIGINT FK → tasks.id (SET NULL, nullable) | commit liên quan task nào |
| sprint_id | BIGINT FK → sprints.id (SET NULL, nullable) | |
| created_at | TIMESTAMP | |

### commit_quality_analysis
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| id | BIGINT PK | |
| commit_id | BIGINT FK → commit_metrics.id (UNIQUE, CASCADE DELETE) | 1-1 với commit |
| message_quality_score | DECIMAL(3,2) | điểm chất lượng message, 0.00–1.00 |
| quality_flags | JSONB (nullable) | các lỗi/nhận xét cụ thể |
| analyzed_at | TIMESTAMP | |
| CHECK | score >= 0.00 AND score <= 1.00 | |

**Quan hệ:**
- `projects` →(1-1)→ `github_integrations`
- `projects` →(1-N)→ `commit_metrics`
- `commit_metrics` →(1-1)→ `commit_quality_analysis`
- `commit_metrics` →(N-1)→ `tasks` (nullable)
- `commit_metrics` →(N-1)→ `sprints` (nullable)

---

## Tóm tắt toàn bộ Foreign Key

```
user_accounts.system_role_id           → system_roles.id
user_profiles.user_id                  → user_accounts.id          (CASCADE)

projects.academic_context_id           → academic_contexts.id
projects.created_by                    → user_accounts.id

project_members.project_id             → projects.id               (CASCADE)
project_members.user_id                → user_accounts.id
project_members.project_role_id        → project_roles.id
project_members.invited_by             → user_accounts.id

invitation_links.project_id            → projects.id               (CASCADE)
invitation_links.project_role_id       → project_roles.id
invitation_links.created_by            → user_accounts.id
invitation_links.used_by               → user_accounts.id

sprints.project_id                     → projects.id               (CASCADE)

rtm_snapshots.project_id               → projects.id               (CASCADE)
rtm_snapshots.sprint_id                → sprints.id                (CASCADE)

shareable_links.project_id             → projects.id               (CASCADE)
shareable_links.created_by             → user_accounts.id

requirements.project_id                → projects.id               (CASCADE)
requirements.owner_id                  → user_accounts.id
requirements.created_by                → user_accounts.id

requirement_tags.requirement_id        → requirements.id           (CASCADE)

use_cases.requirement_id               → requirements.id           (CASCADE)
use_cases.created_by                   → user_accounts.id

use_case_actors.use_case_id            → use_cases.id              (CASCADE)

tasks.project_id                       → projects.id               (CASCADE)
tasks.requirement_id                   → requirements.id           (SET NULL)
tasks.sprint_id                        → sprints.id                (SET NULL)
tasks.primary_assignee_id              → user_accounts.id
tasks.created_by                       → user_accounts.id

task_assignees.task_id                 → tasks.id                  (CASCADE)
task_assignees.user_id                 → user_accounts.id

task_checklists.task_id                → tasks.id                  (CASCADE)

task_dependencies.blocking_task_id     → tasks.id                  (CASCADE)
task_dependencies.blocked_task_id      → tasks.id                  (CASCADE)

test_cases.project_id                  → projects.id               (CASCADE)
test_cases.requirement_id              → requirements.id           (CASCADE)
test_cases.created_by                  → user_accounts.id

test_steps.test_case_id                → test_cases.id             (CASCADE)

test_executions.test_case_id           → test_cases.id             (CASCADE)
test_executions.executed_by            → user_accounts.id

bug_reports.project_id                 → projects.id               (CASCADE)
bug_reports.test_execution_id          → test_executions.id        (SET NULL)
bug_reports.assigned_to                → user_accounts.id
bug_reports.related_task_id            → tasks.id                  (SET NULL)
bug_reports.created_by                 → user_accounts.id

evidence.project_id                    → projects.id               (CASCADE)
evidence.uploaded_by                   → user_accounts.id
evidence.reviewed_by                   → user_accounts.id

evidence_links.evidence_id             → evidence.id               (CASCADE)
evidence_links.(entity_type+entity_id) → polymorphic: requirements | tasks | test_cases | bug_reports | sprints

ai_generation_cache.project_id         → projects.id               (CASCADE)

weekly_reports.project_id              → projects.id               (CASCADE)
weekly_reports.sprint_id               → sprints.id                (SET NULL)
weekly_reports.generated_by            → user_accounts.id

mentor_comments.project_id             → projects.id               (CASCADE)
mentor_comments.commenter_id           → user_accounts.id
mentor_comments.(entity_type+entity_id)→ polymorphic: requirements | weekly_reports | tasks

notifications.user_id                  → user_accounts.id          (CASCADE)
notifications.project_id               → projects.id               (CASCADE)

github_integrations.project_id         → projects.id               (UNIQUE, CASCADE)
github_integrations.connected_by       → user_accounts.id

commit_metrics.project_id              → projects.id               (CASCADE)
commit_metrics.user_id                 → user_accounts.id
commit_metrics.task_id                 → tasks.id                  (SET NULL)
commit_metrics.sprint_id               → sprints.id                (SET NULL)

commit_quality_analysis.commit_id      → commit_metrics.id         (UNIQUE, CASCADE)
```

---

## Luồng dữ liệu chính

```
user_accounts
  └── projects (created_by)
        ├── project_members (nhiều user, mỗi người 1 role)
        ├── sprints
        │     └── rtm_snapshots
        ├── requirements
        │     ├── requirement_tags
        │     ├── use_cases
        │     │     └── use_case_actors
        │     ├── tasks (requirement_id nullable)
        │     │     ├── task_assignees
        │     │     ├── task_checklists
        │     │     └── task_dependencies
        │     └── test_cases
        │           ├── test_steps
        │           └── test_executions
        │                 └── bug_reports
        ├── evidence
        │     └── evidence_links → (requirement|task|test_case|bug_report|sprint)
        ├── weekly_reports
        ├── mentor_comments → (requirement|weekly_report|task)
        ├── notifications
        └── github_integrations
              └── commit_metrics
                    └── commit_quality_analysis
```

---

## Lưu ý đặc biệt cho AI

1. **ON DELETE CASCADE** — xoá project sẽ xoá toàn bộ dữ liệu con theo chuỗi.
2. **ON DELETE SET NULL** — task.requirement_id, task.sprint_id, bug_reports.test_execution_id, bug_reports.related_task_id: khi xoá cha thì con không bị xoá, chỉ field FK về NULL.
3. **Polymorphic references** — `evidence_links` và `mentor_comments` dùng cặp `(entity_type ENUM, entity_id BIGINT)` thay vì FK cứng. Khi query cần filter theo entity_type trước.
4. **JSONB fields** — `acceptance_criteria`, `main_flow`, `alternative_flow`, `steps_to_reproduce`, `snapshot_data`, `input_data`, `output_data`, `quality_flags`, `metadata` đều là JSONB. Không có schema cứng, cần đọc từ application code.
5. **task_assignees vs primary_assignee_id** — tasks có cả `primary_assignee_id` (1 người chính) lẫn bảng `task_assignees` (nhiều người). Cả hai có thể tồn tại đồng thời.
6. **commit_metrics.user_id nullable** — commit từ GitHub chưa chắc map được vào user trong hệ thống, dùng `github_username` làm fallback.