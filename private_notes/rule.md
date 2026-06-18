# AI Development Rules

> These rules are mandatory for any AI assistant, code generator, or automation tool working in this repository.

---

# 1. Database Migration Convention

## Migration Folder
All SQL migration files MUST be stored in:

```text
code/backend/src/main/resources/db/migration
```

---

## Migration File Naming

Format:

```text
Vyyyymmddhhmmss__short_description.sql
```

Example:

```text
V20260517143025__create_initial_tables.sql
```

Rules:
- Use uppercase `V`
- Use timestamp format: `yyyymmddhhmmss`
- Use double underscore `__`
- Description must be:
    - English only
    - lowercase
    - words separated by underscore `_`

---

## Migration Rules

### STRICT RULES
- NEVER modify old migration files
- NEVER delete old migration files
- Every schema change MUST create a NEW migration file
- All migrations must be forward-only

Schema changes include:
- create table
- alter table
- add/remove column
- constraints
- indexes
- enum changes
- seed data
- triggers
- functions
- views

---

## Migration Header Template

Every migration file MUST start with:

```sql
-- Migration: Vyyyymmddhhmmss__description.sql
-- Date: YYYY-MM-DD
-- Author: Author_Name
-- Description: Short description
```

Example:

```sql
-- Migration: V20260519173000__add_project_priority.sql
-- Date: 2026-05-19
-- Author: HungPham
-- Description: Add priority column to projects table
```

---

## Before Creating Migration
AI MUST:
1. Check latest migration version
2. Generate a newer timestamp
3. Avoid duplicate migration numbers

---

# 2. Code Modification Approval Rule

## STRICT RULE

AI MUST NOT modify any code immediately.

Before changing logic/code:
1. Explain:
   - what will change
   - why it is needed
   - affected files
   - possible side effects
2. Ask for confirmation
3. Only modify code after user approval

Example:

```text
Proposed changes:
- Add validation for project status
- Update ProjectService
- Add new migration

Affected files:
- ProjectService.java
- ProjectRepository.java
- migration SQL

Do you approve these changes?
```

---

# 3. Backend Development Rules

## Spring Boot Rules
- Follow layered architecture:
    - controller
    - service
    - repository
    - entity
    - dto
- Business logic MUST stay in service layer
- Controllers MUST stay thin
- Repository layer MUST only access database

---

## DTO Rules
- NEVER expose Entity directly to API response
- Always use DTOs
- Use mapper methods or MapStruct

---

## Validation Rules
- Use Jakarta Validation
- Validate all request DTOs
- Never trust frontend input

---

## Exception Handling
- Use GlobalExceptionHandler
- Never return raw stacktrace
- Return standardized API response

Preferred response format:

```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": [],
  "timestamp": "ISO_DATE"
}
```

---

# 4. Database Rules

## Naming Convention

### Tables
- plural
- snake_case

Example:
```text
users
project_tasks
audit_logs
```

### Columns
- snake_case

### Primary Keys
```text
id
```

### Foreign Keys
```text
{table_name}_id
```

Example:
```text
project_id
user_id
```

---

## Timestamp Columns

Every major table SHOULD contain:

```sql
created_at
updated_at
```

Use:
```sql
NOW()
```

---

# 5. API Rules

## REST Convention

### Use nouns
GOOD:
```text
/api/projects
```

BAD:
```text
/api/getProjects
```

---

## HTTP Methods

- GET → read
- POST → create
- PUT → update
- PATCH → partial update
- DELETE → delete

---

# 6. Git Rules

## Branch Naming

Format:

```text
feature/short-description
bugfix/short-description
hotfix/short-description
```

Example:

```text
feature/project-management
```

---

## Commit Message Convention

Format:

```text
type(scope): short description
```

Examples:

```text
feat(project): add project priority
fix(auth): resolve jwt expiration issue
refactor(user): simplify mapper logic
```

---

# 7. Security Rules

- NEVER hardcode secrets
- NEVER commit:
    - passwords
    - tokens
    - API keys
    - .env files
- Use environment variables

---

# 8. Logging Rules

- Use structured logging
- NEVER use System.out.println
- Use logger instead

Example:

```java
private static final Logger log = LoggerFactory.getLogger(UserService.class);
```

---

# 9. AI Response Rules

When answering:
- Prefer concise explanations
- Explain root cause before solution
- If uncertain → ask first
- Do not hallucinate missing code
- Do not invent APIs/tables/classes

---

# 10. Large Change Safety Rule

If requested change affects:
- authentication
- database schema
- payment logic
- websocket
- deployment
- security

AI MUST:
1. warn about risks
2. explain impact
3. request approval again

---

# 11. File Creation Rules

When creating new files:
- explain why file is needed
- follow existing project structure
- avoid duplicate utilities/classes

---

# 12. Frontend Rules

## React Rules
- Prefer functional components
- Use hooks
- Keep components small
- Avoid duplicated state

---

## API Calling
- API logic must stay in service files
- Components should not directly contain fetch logic

---

# 13. Clean Code Rules

- Avoid magic numbers
- Use meaningful variable names
- Methods should do ONE thing
- Avoid long methods (>50 lines preferred)

---

# 14. Documentation Rules

When adding:
- complex logic
- algorithms
- custom security
- websocket flow

AI SHOULD add comments/documentation.

---

# 15. Final Mandatory Rule

AI MUST prioritize:
1. code safety
2. maintainability
3. readability
4. consistency

over:
- quick hacks
- temporary fixes
- unsafe shortcuts
# 16. Knowledge Base Maintenance Rule

## Purpose

The `private_notes` folder is the evolving project knowledge base.

Its purpose is NOT to store every prompt or every conversation.

Its purpose is to continuously improve AI understanding of the system.

---

## Core Principle

AI MUST maintain `private_notes` as a clean, accurate, and updated system memory.

After important development changes, AI should:

- update outdated knowledge
- improve unclear explanations
- remove obsolete information
- refine architecture understanding
- synchronize docs with actual codebase

The goal is better future understanding, not documentation accumulation.

---

## Update Triggers

AI SHOULD update relevant notes after:

- feature implementation
- bug fixes
- architecture changes
- API changes
- migration changes
- business rule updates
- major technical decisions
- discovery of incorrect documentation

---

## Smart Update Rule

AI MUST NOT blindly append new content.

AI SHOULD choose ONE action:

### Add
When new knowledge does not exist.

### Modify
When existing information becomes outdated.

### Refactor
When documentation structure becomes unclear.

### Remove
When information is obsolete, duplicated, or incorrect.

---

## Documentation Evolution Rule

`private_notes` must evolve with the project.

Example:

BAD:

```md
2026-05-01:
Use JWT.

2026-05-05:
Use OAuth.

2026-05-10:
Use Session Auth.
```

GOOD:

```md
## Authentication Strategy

Current:
OAuth2 + JWT

History:
- Replaced legacy JWT-only approach.
```

---

## Relevance Rule

AI MUST only update files related to the current task.

Avoid unrelated documentation changes.

---

## Knowledge Quality Rule

Documentation should prioritize:

- architecture understanding
- business flow understanding
- technical decisions
- known exceptions
- important constraints

NOT:
- every prompt
- temporary debugging logs
- trivial edits
- duplicated explanations

---

## Future Session Rule

When updating notes, AI should ask:

"Will this help a future AI session understand the system better?"

If NO → do not document.

---

## Final Rule

`private_notes` is a maintained knowledge system, not a conversation archive.
# 17. AI Context Optimization Rules

## Purpose

Reduce unnecessary token usage while maintaining enough project knowledge for accurate development.

---

## Selective Reading Rule

AI MUST NOT read all `.md` files every time.

AI should:
1. Read only files relevant to current task
2. Avoid re-reading unchanged documents
3. Prioritize summarized knowledge first

Example:
- Bug in authentication
  → read:
    - exception.md
    - auth-related notes
  → do NOT read:
    - unrelated frontend docs

---

## Minimal Update Rule

AI MUST:
- append concise updates
- avoid rewriting entire documents
- avoid duplicated explanations
- avoid verbose summaries

BAD:
```md
Rewriting entire architecture explanation...
```

GOOD:
```md
## 2026-05-20
- Added JWT refresh token flow
- Updated AuthService
- Added refresh_tokens table
```

---

## Documentation Compression Rule

AI SHOULD prefer:
- bullet points
- short summaries
- compact technical notes

Instead of long paragraphs.

---

## Avoid Duplicate Context

AI MUST NOT duplicate:
- same architecture explanation
- same API description
- repeated business logic notes

If information already exists:
- reference it
- extend it minimally

---

## Incremental Documentation Strategy

AI should document only:
- delta changes
- newly introduced logic
- important decisions
- breaking changes

NOT the entire system repeatedly.

---

## Recommended File Roles

### Stable Knowledge (rarely updated)
- SystemArchitecture.md
- rule.md

### Frequently Updated
- DevTrackAI_Feature_Report.md
- exception.md
- decision_log.md

This helps minimize token usage.

---

## Summary First Rule

Large documents SHOULD contain:

```md
# Quick Summary
```

at the top.

AI MUST read summary first before scanning full document.

---

## Change Log Strategy

Prefer:

```md
## Changelog
```

instead of rewriting sections.

Example:

```md
## 2026-05-20
- Added project priority
- Updated ProjectService validation
```

---

## AI Memory Efficiency Rule

AI SHOULD:
- keep responses concise
- avoid repeating user requirements
- avoid regenerating unchanged code
- avoid re-explaining known architecture

---

## Final Rule

The goal is:
- maximum maintainability
- minimal token consumption
- high long-term consistency