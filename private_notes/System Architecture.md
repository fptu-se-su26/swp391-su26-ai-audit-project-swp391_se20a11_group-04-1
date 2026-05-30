# DevTrack AI — System Architecture

> Version: 1.0  
> Project: DevTrack AI  
> Architecture Style: Modular Monolith + Feature-Based Frontend  
> Tech Stack: React + Spring Boot + PostgreSQL + Redis

---

# 1. System Overview

DevTrack AI là nền tảng quản lý project học thuật dành cho sinh viên IT với trọng tâm:

- Requirement Traceability
- AI-assisted workflow
- Evidence-based progress tracking
- Contribution analytics
- Academic project management

Khác với Trello/Jira truyền thống, hệ thống tập trung vào:

```text
Requirement
    → Task
        → Evidence
            → Test Case
                → Bug
                    → RTM
                        → Analytics
```

---

# 2. High-Level Architecture

```text
┌────────────────────────────────────┐
│              Frontend              │
│                React               │
│------------------------------------│
│ Feature-based architecture         │
│ Zustand state management           │
│ Axios API client                   │
│ Route-based modules                │
└────────────────────────────────────┘
                  │
                  │ REST API
                  ▼
┌────────────────────────────────────┐
│              Backend               │
│            Spring Boot             │
│------------------------------------│
│ Controller Layer                   │
│ Service Layer                      │
│ Repository Layer                   │
│ Security Layer                     │
│ AI Integration Layer               │
│ Webhook/Event Processing           │
└────────────────────────────────────┘
         │                │
         ▼                ▼
┌────────────────┐   ┌────────────────┐
│ PostgreSQL     │   │ Redis          │
│----------------│   │----------------│
│ Main Database  │   │ Cache          │
│ Relationships  │   │ OTP            │
│ RTM Data       │   │ Session        │
│ Evidence Meta  │   │ Token          │
└────────────────┘   └────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ External Integrations              │
│------------------------------------│
│ OpenAI / Claude API                │
│ GitHub API                         │
│ Cloudinary                         │
│ Figma API                          │
└────────────────────────────────────┘
```

---

# 3. Architecture Principles

## 3.1 Backend Architecture

Backend sử dụng:

```text
Layered Architecture
```

Structure chuẩn:

```text
controller
    ↓
service
    ↓
repository
    ↓
database
```

### Responsibilities

| Layer | Responsibility |
|---|---|
| Controller | HTTP request/response |
| Service | Business logic |
| Repository | Database access |
| Entity | ORM mapping |
| DTO | API contract |
| Mapper | Entity ↔ DTO conversion |

---

## 3.2 Frontend Architecture

Frontend sử dụng:

```text
Feature-Based Architecture
```

Mỗi business module là một feature độc lập:

```text
features/
    auth/
    workspace/
    requirement/
    kanban/
    testing/
    evidence/
    rtm/
    ai-engine/
    analytics/
    mentor/
```

Mỗi feature có:

```text
components/
services/
pages/
```

---

# 4. Core Business Flow

## 4.1 Requirement Traceability Flow

```text
Requirement
    ↓
Use Case
    ↓
Task
    ↓
Evidence
    ↓
Test Case
    ↓
Bug Report
    ↓
RTM
    ↓
Analytics & Report
```

Đây là core architecture của toàn hệ thống.

---

# 5. Module Architecture

---

## 5.1 Auth Module

### Responsibilities
- Login
- Register
- OTP verification
- JWT authentication
- Session management

### Backend Components

```text
AuthController
AuthService
JwtService
UserRepository
RedisOTPService
```

### Frontend Components

```text
features/auth/
```

---

## 5.2 Workspace Module

### Responsibilities
- Project management
- Sprint management
- Member management
- Role assignment

### Core Entities

```text
Project
ProjectMember
Sprint
Role
Invitation
```

---

## 5.3 Requirement Module

### Responsibilities
- Requirement management
- Use case management
- Requirement status calculation

### Important Logic

Requirement status được tính động:

```text
RequirementStatus =
    task completion +
    test pass rate +
    evidence validation
```

---

## 5.4 Kanban Module

### Responsibilities
- Task board
- Task lifecycle
- Task dependency
- Sprint assignment

### Important Rule

Task Done flow phải kiểm tra:

```text
- evidence uploaded
- review completed
- commit linked
```

---

## 5.5 Testing Module

### Responsibilities
- Test case management
- Execution history
- Bug tracking

### Key Relationship

```text
Requirement
    ↔ TestCase
        ↔ Bug
```

---

## 5.6 Evidence Module

### Responsibilities
- Upload evidence
- Evidence validation
- Evidence preview
- GitHub commit evidence

### Storage Strategy

| Type | Storage |
|---|---|
| File | Cloudinary |
| Metadata | PostgreSQL |
| Cache | Redis |

### Evidence Validation Flow

```text
Pending
    ↓
Auto Checked
    ↓
Accepted / Rejected
```

---

## 5.7 RTM Module

### Responsibilities
- Traceability matrix
- Requirement tracking
- Export report

### RTM Status Logic

```text
Done
At Risk
In Progress
Not Started
Blocked
```

RTM là central monitoring module.

---

## 5.8 AI Engine Module

### Responsibilities
- Generate task
- Generate test case
- Missing artifact detection
- Weekly report

### AI Architecture Principle

AI chỉ:
- suggest
- summarize
- detect patterns

AI KHÔNG:
- quyết định business logic
- tự động modify dữ liệu quan trọng

---

## 5.9 Code Insight Module

### 3-Layer Analysis

### Layer 1 — GitHub Metrics

- commit analytics
- heatmap
- contribution tracking

### Layer 2 — Static Analysis

- ESLint
- Pylint
- Checkstyle
- duplication analysis

### Layer 3 — AI Diff Review

Review git diff thay vì full repository để tối ưu chi phí.

---

# 6. Database Architecture

## 6.1 Database Type

```text
PostgreSQL
```

Lý do:
- relational consistency
- complex joins cho RTM
- JSONB support
- strong indexing
- transaction safety

---

## 6.2 Database Conventions

### Table Naming

```text
snake_case
plural nouns
```

Example:

```text
projects
requirements
test_cases
evidences
```

---

## 6.3 Migration Strategy

Migration tool:

```text
Flyway
```

Rules:
- forward-only migration
- never edit old migration
- create new version for every schema change

---

# 7. Redis Architecture

Redis dùng cho:

```text
OTP storage
JWT blacklist
session cache
temporary AI cache
notification cache
```

Redis KHÔNG dùng làm source of truth.

---

# 8. API Architecture

## REST Convention

```text
/api/v1/
```

Example:

```text
/api/v1/auth/login
/api/v1/projects
/api/v1/requirements
```

---

## Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "errors": [],
  "timestamp": "ISO_DATE"
}
```

---

# 9. Security Architecture

## Authentication

```text
JWT Authentication
```

## Authorization

```text
Project-based RBAC
```

Một user có thể:
- Leader ở project A
- Member ở project B

---

## Security Rules

- No hardcoded secret
- Validate all input
- DTO-only API exposure
- Global exception handler
- Environment variables only

---

# 10. Frontend State Management

## Zustand

Global state:
- auth state
- notification state
- UI preferences

Local component state:
- forms
- modal visibility
- temporary UI interaction

---

# 11. File Storage Architecture

## Cloudinary

Dùng cho:
- image evidence
- video evidence
- document upload

Database chỉ lưu:
- URL
- metadata
- relationships

---

# 12. AI Integration Architecture

## Recommended Providers

| Provider | Purpose |
|---|---|
| OpenAI GPT-4o-mini | Cost-efficient |
| Claude | Better reasoning |

---

## AI Request Strategy

Không gửi full project.

Chỉ gửi:
- requirement
- acceptance criteria
- git diff
- task context

---

# 13. Event & Automation Flow

## GitHub Webhook Flow

```text
GitHub Commit
    ↓
Webhook
    ↓
Backend Processor
    ↓
Create Evidence
    ↓
Update RTM
```

---

## AI Detection Flow

```text
Scheduler
    ↓
Rule Engine
    ↓
Detect Missing Artifact
    ↓
AI Summary
    ↓
Notification
```

---

# 14. MVP Scope

## Must-Have

- Auth
- Workspace
- Requirement
- Kanban
- Testing
- Evidence
- RTM
- AI Engine basic

---

## Should-Have

- Code Insight
- Mentor Dashboard
- Analytics

---

## Nice-to-Have

- AI Diff Review
- RTM Snapshot
- Shareable report

---

# 15. Scalability Strategy

Current architecture:

```text
Modular Monolith
```

Lý do:
- Team nhỏ
- 9 tuần development
- Dễ debug
- Dễ deploy

Future:
Có thể tách thành microservices:
- AI Service
- Notification Service
- Analytics Service

nếu hệ thống lớn hơn.

---

# 16. Recommended Folder Structure

## Backend

```text
backend/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── mapper/
├── security/
├── config/
├── exception/
├── scheduler/
├── webhook/
└── ai/
```

---

## Frontend

```text
src/
├── api/
├── assets/
├── components/
├── context/
├── hooks/
├── routes/
├── store/
├── utils/
└── features/
```

---

# 17. Engineering Principles

## Priorities

1. Traceability
2. Maintainability
3. Evidence-first workflow
4. Academic usability
5. AI-assisted productivity

---

# 18. Non-Goals

Hệ thống KHÔNG cố gắng:
- thay thế Jira enterprise
- chấm điểm sinh viên tự động
- dùng AI cho mọi thứ
- build microservices quá sớm

---

# 19. Final Architecture Summary

DevTrack AI được thiết kế như:

```text
Academic Traceability Workspace
```

với:
- feature-based frontend
- modular monolith backend
- AI-assisted workflow
- evidence-centric project tracking
- RTM-driven project monitoring

Architecture ưu tiên:
- development speed
- maintainability
- low infrastructure cost
- demo stability
- academic workflow optimization