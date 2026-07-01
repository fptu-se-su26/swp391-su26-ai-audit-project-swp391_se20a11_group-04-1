# AI Audit Log

## 1. General Information

| Field | Content |
|---|---|
| Course | Software Engineering Practice |
| Course Code | SWP391 |
| Class | SE20A11 |
| Semester | Summer 2026 |
| Assignment / Project | DevTrack AI — AI-Powered Software Audit / Test Management Platform |
| Student / Group | Phạm Duy Hưng — Group 04 |
| Student ID | DE190330 |
| Supervisor | |
| Start Date | 01/05/2026 |
| Completion Date | 30/06/2026 |

---

## 2. AI Tools Used

- [ ] ChatGPT
- [ ] Gemini
- [ ] Claude
- [ ] GitHub Copilot
- [ ] Cursor
- [x] Antigravity (Kiro)
- [ ] Perplexity
- [ ] Microsoft Copilot
- [ ] Other tools: ....................................

> Note: Antigravity (Kiro) was chosen as the primary AI tool because it is an agentic, codebase-aware assistant capable of reading and reasoning across the full multi-service stack of DevTrack AI (Spring Boot backend, Node.js Playwright/Agent services, React frontend) in a single session, rather than producing isolated code snippets.

---

## 3. Purpose of AI Usage

```text
- Design the Review/Approve architecture for AI-based Test Case Generation (multi test case + AI auto-type selection).
- Design the fully asynchronous Test Execution architecture (Kafka + Outbox Pattern + WebSocket) to replace the blocking synchronous flow.
- Diagnose and resolve database/ORM issues during Flyway migration (NOT NULL constraints, Hibernate 7 enum mapping, ID type mismatches).
- Analyze why two Test Runs triggered at nearly the same time could not execute in parallel (Kafka partitioning behavior).
- Design the DevTrack Local Agent (polling CLI) to allow cloud workers to delegate localhost UI tests to a developer's own machine.
- Diagnose why screenshot evidence was missing for Local-Agent-executed test runs, and design the Base64 → Cloudinary upload pipeline.
- Produce a horizontal-scaling plan (Kubernetes + KEDA) for the Playwright worker fleet based on the existing worker.js design.
- Design the backend architecture for a standalone API Testing module (Postman-style request/assertion engine with Local Agent delegation for private URLs).
- Design a Postman-inspired split-pane UI for the API Testing module.
- Redesign the global UI design system (color tokens, shadows, sidebar animation) from an indigo/purple theme to a teal enterprise theme.
- Draft structured SRS screen specifications (triggers, actors, API calls, business rules, flows) for multiple screens.
- Draft a PowerShell automation script and startup documentation to boot the five required local services in the correct order.
```

---

## 4. Detailed AI Usage Log

---

### AI Usage Entry #1

| Field | Content |
|---|---|
| Date | 02/06/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Design the Review/Approve architecture for AI Test Case Generation |
| Related Work | Design / Backend / Frontend |
| Usage Level | Heavy assistance |

#### 4.1 Prompt Used

```text
I am building the AI Gen TestCase feature for DevTrackAI. Currently the AI only generates 1 test
case and auto-fills it into the form. I want to change this so that:
1. The AI generates multiple test cases (3-8) instead of 1.
2. There is a Review/Approve flow similar to AiUseCaseGenerationModal.
3. The AI can choose the test type (UI/API/MANUAL) per test case automatically.

Please analyze the current source code and propose the backend + frontend architecture changes
required.
```

#### 4.2 AI-Suggested Result

```text
The AI proposed an architecture consisting of:
- Backend: change the return type of generateTestCases() from TestCaseRequest to
  List<TestCaseRequest>, persist it into AiGenerationStaging (stage = TEST_CASE), and return a
  generationId.
- Backend: 3 new endpoints — POST /generate-ai, GET /generate-ai/{id}, POST
  /generate-ai/{id}/approve.
- Frontend: a new AiTestCaseReviewModal (3-panel layout: AI Analysis, Test Case List, Detail
  Editor) and AiTestCaseProgressModal.
- New state isAiReviewOpen and currentGenerationId added to useTestCaseStore.
```

#### 4.3 Parts Adopted From AI

```text
- The Mermaid sequence diagram describing the generate → review → approve flow.
- The 3-endpoint controller structure.
- The initial 3-panel skeleton for AiTestCaseReviewModal.
- The base logic of approveTestCaseGeneration() inside AiGenerationService.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Decided to persist to AiGenerationStaging instead of returning data directly, so that in-progress
  review data survives a page refresh.
- Rewrote the JsonNode → TestCase entity mapping logic inside approveTestCaseGeneration();
  discovered the AI-generated code forgot to call tc.setProjectId().
- Added auto-incrementing tcCode generation (TC-1, TC-2, ...) which the AI omitted.
- Refactored AiTestCaseReviewModal from a full-page layout to a fixed modal with internal
  overflow scroll, because the AI's original layout broke on small screens.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | AiGenerationService.java, TestCaseController.java, AiTestCaseReviewModal.jsx |
| Other Notes | See private_notes/AIGentestcase_plan.md |

#### 4.6 Personal Comment

```text
The AI produced the high-level architecture quickly and correctly, but the implementation
details (entity mapping, auto-code generation) still required manual review. Missing
projectId is a good example of a serious bug that would have shipped if not checked line by
line.
```

---

### AI Usage Entry #2

| Field | Content |
|---|---|
| Date | 15/05/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Design the fully asynchronous Test Execution architecture (Kafka + Outbox + WebSocket) |
| Related Work | Design / Backend |
| Usage Level | Heavy assistance |

#### 4.1 Prompt Used

```text
I need to implement asynchronous test execution for DevTrackAI, converting it from
synchronous to fully async using Kafka + WebSocket real-time updates. The current
implementation blocks the HTTP request while Playwright runs. I need this to handle race
conditions, semantic error states, and multi-instance safety (multiple backend/worker
instances running at once). Please define the full TestRun/TestExecution state machine,
the Outbox event schema, and the WebSocket event taxonomy before writing any code.
```

#### 4.2 AI-Suggested Result

```text
The AI proposed: createTestRun() returns HTTP 202 immediately; an Outbox table decouples DB
writes from Kafka publishing; a WatchdogScheduler (ShedLock-protected) recovers stuck runs;
a strict TestRunStatus/TestExecutionStatus state machine with isTerminal() helpers; and a
thin Kafka command payload (IDs only) paired with richer WebSocket events for the frontend.
```

#### 4.3 Parts Adopted From AI

```text
- The full TestRun/TestExecution status enum and its valid-transition table.
- The Outbox Pattern table design and the ShedLock-protected watchdog scheduler skeleton.
- The separation between "thin" Kafka command payloads and "rich" WebSocket events.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Verified state transitions against real Playwright failure scenarios (e.g. SKIPPED steps)
  that the first AI draft did not account for.
- Adjusted the idempotency handling in receiveExecutionResult() to tolerate duplicate Kafka
  redeliveries, since the AI's first version assumed exactly-once delivery.
- Cross-checked the Kafka DLQ / retry strategy against the team's actual infra constraints
  (single-broker dev Kafka) and simplified it accordingly.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | SUPER_PROMPT_ASYNC_TEST_EXECUTION.md, TestRunService.java, OutboxEvent entity, KafkaEventPublisher.java |
| Other Notes | Architecture doc used as an implementation contract before coding started |

#### 4.6 Personal Comment

```text
This was the most architecturally significant AI session in the project. The AI was useful for
producing a complete, internally consistent state machine on the first pass, which is hard to
get right by hand. However, the failure-handling edge cases (duplicate delivery, watchdog
recovery) needed to be reasoned through manually against the team's actual Kafka setup.
```

---

### AI Usage Entry #3

| Field | Content |
|---|---|
| Date | 20/05/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Diagnose Flyway/Hibernate migration errors during async schema implementation |
| Related Work | Database / Debug |
| Usage Level | Moderate assistance |

#### 4.1 Prompt Used

```text
After adding the test_runs and test_executions tables via Flyway, I'm getting a NOT NULL
constraint violation on test_runs.started_at, a Hibernate 7 vs PostgreSQL enum type mismatch
on test_executions.environment, and a VARCHAR/BIGINT type mismatch on test_runs.id. Explain
the root cause of each error and the safest migration-level fix (not a code workaround).
```

#### 4.2 AI-Suggested Result

```text
The AI identified that started_at should be nullable at the DB level (set at RUNNING, not at
creation), that Hibernate 7's default enum handling needs an explicit @JdbcType or
columnDefinition to match the PostgreSQL native enum, and that test_runs.id needed to be
declared as BIGINT consistently across the entity, repository generics, and the FK columns
referencing it.
```

#### 4.3 Parts Adopted From AI

```text
- The explanation of Hibernate 7's stricter enum-to-PostgreSQL-enum binding requirement.
- The suggested Flyway migration pattern for altering a column type safely (add nullable
  column → backfill → alter NOT NULL) instead of a destructive ALTER.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Verified the actual column type in the running PostgreSQL instance via psql before applying
  any suggested fix, since the AI's diagnosis was based only on the entity code shown to it.
- Wrote a new versioned migration file rather than editing an already-applied one, to keep the
  Flyway history consistent (the AI's first suggestion was to edit the existing migration).
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | V*_async_flow.sql migration files, TestRun.java, TestExecution.java |

#### 4.6 Personal Comment

```text
Useful for quickly narrowing down which of three simultaneous errors was the actual root
cause, but the fix had to respect Flyway's append-only migration discipline, which the AI did
not consider by default.
```

---

### AI Usage Entry #4

| Field | Content |
|---|---|
| Date | 25/05/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Root-cause why two Test Runs triggered together could not execute in parallel |
| Related Work | Debug / Backend / Infrastructure |
| Usage Level | Heavy assistance |

#### 4.1 Prompt Used

```text
Two test cases run at nearly the same time are being executed sequentially instead of in
parallel, even though we have 3 worker replicas and partitionsConsumedConcurrently = 3.
Analyze KafkaEventPublisher.java and worker.js and explain the exact reason, considering
Kafka partitioning, consumer group assignment, and the fact that eachMessage() awaits the
full test run.
```

#### 4.2 AI-Suggested Result

```text
The AI traced three contributing causes: (1) OutboxEvent publishing has no partition key, so
messages are distributed round-robin and can land on the same partition; (2) eachMessage()
awaits handleTestRunJobCommand() fully, so two messages on the same partition are processed
strictly in order; (3) even with 3 replicas, all workers share one consumer group, so two
messages assigned to the same worker's partitions still queue behind each other.
```

#### 4.3 Parts Adopted From AI

```text
- The diagnosis that partition co-location, not replica count, was the actual bottleneck.
- The proposed fix of using testRunId as the Kafka message key to spread runs across
  partitions, combined with a semaphore inside the worker to bound true concurrency.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Verified the claim empirically by adding partition-id logging and reproducing the collision
  before accepting the fix.
- Rejected the AI's first "fire-and-forget" suggestion (dropping the await entirely) as too
  risky without a concurrency limiter, and instead combined it with an explicit semaphore, as
  documented in the comparison table of the analysis.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | analysis_parallel_testrun_V6.md, KafkaEventPublisher.java, worker.js |

#### 4.6 Personal Comment

```text
This is a case where the AI's initial fix (fire-and-forget) would have introduced a resource
overload risk if applied blindly. Reading the trade-off table it generated and picking the
lower-risk combined option (key + semaphore) was a manual decision, not something the AI
enforced on its own.
```

---

### AI Usage Entry #5

| Field | Content |
|---|---|
| Date | 28/05/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Design the DevTrack Local Agent for testing localhost applications |
| Related Work | Design / Backend / Node.js |
| Usage Level | Heavy assistance |

#### 4.1 Prompt Used

```text
Our Playwright workers run in the cloud, so they cannot reach a developer's localhost:5173.
I want a "Local Agent" pattern similar to BrowserStack Local Testing: the cloud worker
detects a localhost URL, creates a pending task, and a small CLI polling on the developer's
machine picks it up, runs Playwright locally, and reports the result back. Propose the
AgentTask entity, the required endpoints, and how this integrates into the existing
testRunConsumer.js without changing the flow for public URLs.
```

#### 4.2 AI-Suggested Result

```text
The AI proposed an AgentTask entity (status PENDING → CLAIMED → COMPLETED/FAILED/TIMEOUT),
4 internal endpoints secured with X-Internal-Service-Key, an isLocalUrl() routing helper
inside testRunConsumer.js, and a devtrack-agent Node.js CLI package with a 3-second polling
loop reusing the existing executor.js.
```

#### 4.3 Parts Adopted From AI

```text
- The AgentTask state machine and endpoint contract.
- The isLocalUrl()/delegateToLocalAgent() routing pattern that leaves the existing public-URL
  flow untouched.
- The idea of reusing executor.js as-is inside the Local Agent CLI to guarantee identical test
  execution behavior between cloud and local runs.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Set an explicit 5-minute timeout on the polling loop and confirmed with the team that a
  worker being "held" for 5 minutes on one partition was an acceptable trade-off for this
  project's scale, rather than accepting the AI's default silently.
- Decided to store agent_token directly on the Project entity instead of a separate
  AgentToken entity, after weighing both options the AI presented, to keep the schema simpler
  for a single-token-per-project use case.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | devtrack_local_agent_prompt.md, implementation_plan_runtestcaseV1.md, AgentTask.java, testRunConsumer.js |

#### 4.6 Personal Comment

```text
The AI correctly flagged the Kafka session-timeout risk of a 5-minute blocking wait per
partition as a known trade-off rather than hiding it, which helped the team make an informed
decision instead of discovering the issue later in testing.
```

---

### AI Usage Entry #6

| Field | Content |
|---|---|
| Date | 01/06/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Implement the DevTrack Agent polling CLI and CDP screencast streaming |
| Related Work | Coding / Node.js |
| Usage Level | Moderate assistance |

#### 4.1 Prompt Used

```text
Implement the polling loop for devtrack-agent/agent.js: poll GET /agent-tasks/pending every 3
seconds, auto-install Playwright Chromium on first run if missing, execute the received
script via executor.js, and POST the result back. Also relay a live Chrome DevTools Protocol
(CDP) screencast over WebSocket so the frontend can show a live video while the local test
runs.
```

#### 4.2 AI-Suggested Result

```text
The AI generated the setInterval polling skeleton, a try/catch around each poll cycle, and a
CDP Page.startScreencast() relay pattern that forwards frames over a WebSocket room.
```

#### 4.3 Parts Adopted From AI

```text
- The base polling loop and error-handling try/catch structure.
- The general CDP screencast relay concept (Page.startScreencast → WebSocket frames).
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Fixed a parameter bug where the AI-generated executor.js call overwrote the envOverrides
  argument instead of merging it, causing a Node.js crash on scripts with custom env vars.
- Rewrote the WebSocket room-id scheme as `${testRunId}-${executionId}` instead of the AI's
  original `${testRunId}` alone, to avoid frame collisions between concurrent executions of
  the same TestRun in the future (documented as a resolved risk, not a hypothetical one).
- Fixed a duplicate `app:` block in application.yaml that the AI's auto-merge suggestion
  introduced, which silently overrode the WebSocket relay URL.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | devtrack-agent/agent.js, executor.js, application.yaml |
| Other Notes | CHANGELOG Phase 05 — "CDP Screencast Live Stream" and "YAML Config Override" fix |

#### 4.6 Personal Comment

```text
Two of the three bugs found here (envOverrides overwrite, YAML duplicate block) were subtle
integration bugs that only surfaced when actually running the agent end-to-end, not something
a code read-through alone would have caught.
```

---

### AI Usage Entry #7

| Field | Content |
|---|---|
| Date | 05/06/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Diagnose missing screenshot evidence for Local-Agent test runs and design the fix |
| Related Work | Debug / Backend |
| Usage Level | Moderate assistance |

#### 4.1 Prompt Used

```text
Screenshots are missing for test runs executed via the Local Agent, even though executor.js
captures .png files during the Playwright run. LocalTestRunWorker.java currently reads a
field called evidenceUrls from the agent's result payload. Analyze the mismatch across
devtrack-agent/executor.js, LocalTestRunWorker.java, and the Cloud Playwright flow, and
propose a fix that does not store raw Base64 strings in PostgreSQL.
```

#### 4.2 AI-Suggested Result

```text
The AI identified that executor.js discarded the screenshots array instead of populating it,
and that the backend was reading the wrong field name (evidenceUrls instead of screenshots).
It proposed a storeBase64File() method on FileStorageService, decoding Base64 to bytes and
uploading to Cloudinary from the Java backend rather than storing Base64 in the database.
```

#### 4.3 Parts Adopted From AI

```text
- The overall pipeline: Agent/Cloud Worker sends Base64 → Backend decodes and uploads to
  Cloudinary → only the resulting URL is persisted.
- The FileStorageService interface extension pattern (storeBase64File) applied consistently
  to both the Cloudinary implementation and the Mock implementation used in tests.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Confirmed that both the Cloud Playwright flow and the Local Agent flow had the same field
  mismatch bug, not just the Local Agent, which the initial AI analysis had only partially
  covered — this was found by re-reading executeViaPlaywrightService() manually.
- Flagged the database-bloat risk of storing Base64 directly (a decision explicitly called out
  as "User Review Required" before implementing, rather than accepted blindly).
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | implementation_plan_fix_Agent.md, devtrack-agent/executor.js, LocalTestRunWorker.java, CloudinaryFileStorageServiceImpl.java |

#### 4.6 Personal Comment

```text
Good example of the AI correctly identifying a symptom (missing screenshots) but only after
being explicitly pointed at multiple files did it find that the same bug existed in two
separate code paths (Cloud and Local), which required cross-checking manually.
```

---

### AI Usage Entry #8

| Field | Content |
|---|---|
| Date | 08/06/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Produce a horizontal-scaling plan for the Playwright worker fleet |
| Related Work | Infrastructure / DevOps |
| Usage Level | Heavy assistance |

#### 4.1 Prompt Used

```text
Given our current worker.js (Kafka consumer group "playwright-service-group", autoCommit
false, sessionTimeout 300000ms), evaluate whether the code is actually ready to scale
horizontally, and produce a staged plan (dev → Docker → Kubernetes + KEDA) with concrete
manifests, explaining what specifically needs to change before deploying multiple replicas.
```

#### 4.2 AI-Suggested Result

```text
The AI confirmed the design was largely scale-ready (stateless workers, shared consumer
group, autoCommit false, auto-reconnect loop) but flagged sessionTimeout=300000ms as too high
for fast failover, and a shared clientId across instances as a monitoring risk. It produced a
Kubernetes Deployment manifest and a KEDA ScaledObject keyed on Kafka consumer lag.
```

#### 4.3 Parts Adopted From AI

```text
- The staged rollout plan (dev terminals → Docker containers → K8s + KEDA) as a way to
  communicate the scaling story without needing a live cluster for the demo.
- The KEDA lag-to-replica formula and the Kubernetes resource request/limit values as a
  starting baseline.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Recomputed the KEDA scaling formula against the team's realistic classroom load (approx. 30
  concurrent students) to sanity-check the maxReplicaCount value the AI suggested, rather than
  using it unquestioned.
- Cross-referenced the sessionTimeout fix recommendation against the earlier partition/parallel
  test-run analysis (Entry #4) to confirm the two pieces of advice from separate sessions were
  consistent with each other.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | scale-horizontal-kubernetes.md |
| Other Notes | Plan-only artifact; no live Kubernetes cluster was deployed for this course project |

#### 4.6 Personal Comment

```text
This session produced a plan document rather than executable infrastructure, since the team
does not have a Kubernetes cluster for this course project. The value was in verifying that
the existing worker.js design decisions (made earlier, partly with AI help) were actually
sound engineering choices and not just convenient defaults.
```

---

### AI Usage Entry #9

| Field | Content |
|---|---|
| Date | 10/06/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Design the backend architecture for the standalone API Testing module |
| Related Work | Design / Backend |
| Usage Level | Heavy assistance |

#### 4.1 Prompt Used

```text
Design a Postman-style API Testing module for DevTrackAI: test cases with method/URL/headers/
body/assertions, environments with variables, direct execution for public URLs, and delegation
through the existing AgentTask/Local Agent mechanism for localhost URLs. Our stack is
spring-boot-starter-webmvc (no WebFlux). Propose the schema, the execution flow for both
cases, and how to avoid a circular dependency between ApiTestExecutorService and
AgentTaskService.
```

#### 4.2 AI-Suggested Result

```text
The AI proposed 3 new tables (api_environment, api_test_case, api_test_result), a dedicated
@Async("apiTestExecutor") thread pool separate from the default one, direct RestTemplate calls
for public URLs, reuse of AgentTaskService for private URLs, and a Spring
ApplicationEventPublisher (ApiTestJobCompletedEvent) to decouple ApiTestExecutorService from
AgentTaskService and avoid the circular dependency.
```

#### 4.3 Parts Adopted From AI

```text
- The 3-table schema, including the PENDING status pattern and agent_task_id FK for mapping
  async local results back to the correct api_test_result row.
- The ApplicationEventPublisher-based decoupling pattern instead of a direct service-to-service
  call.
- The dedicated apiTestExecutor thread pool bean to avoid starving the default async pool.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Required the AI to revise its first draft, which had ApiTestExecutorService call
  AgentTaskService directly (a real circular dependency risk once AgentTaskService needed to
  call back into API test evaluation) — this is documented explicitly in the plan's "Tóm tắt
  thay đổi mới nhất" comparison table.
- Added the fallback `taskType != null ? ... : "PLAYWRIGHT"` default in AgentTask.builder() to
  protect existing Local Agent UI test flows from breaking once taskType was introduced.
- Defined the exact HTTP 200 + body {"status":"PENDING"} polling contract for the frontend,
  since the AI's first draft used a 202 status code that was inconsistent with how the
  existing Local Agent UI flow signals "waiting".
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | TTapi_testing_implementation_plan.md, ApiTestExecutorService.java, ApiTestJobCompletedEvent.java |

#### 4.6 Personal Comment

```text
The circular dependency issue is the clearest example in this project of catching an AI design
flaw before implementation rather than after — it required actually tracing the call graph by
hand, not just accepting the "looks clean" first draft.
```

---

### AI Usage Entry #10

| Field | Content |
|---|---|
| Date | 12/06/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Design a Postman-inspired split-pane UI for the API Testing module |
| Related Work | Frontend / UI Design |
| Usage Level | Moderate assistance |

#### 4.1 Prompt Used

```text
Design the API Testing screen for DevTrackAI following our "Tactical Telemetry" technical UI
style: high visual density, split-pane layout like Postman, monospace typography for JSON/
headers/URL, minimal transitions, flat high-contrast buttons. Propose the component tree,
Zustand store shape, and how polling for PENDING (Local Agent) results should be cleaned up to
avoid memory leaks.
```

#### 4.2 AI-Suggested Result

```text
The AI proposed ApiTestPage (sidebar list + main workspace), ApiTestCaseDetail as a left
Request Builder / right Response Viewer split, a dedicated useApiTestStore Zustand store, and
a runApiTest()/stopPolling() pair with the interval id stored in Zustand.
```

#### 4.3 Parts Adopted From AI

```text
- The overall page structure (25% sidebar / 75% workspace) and the split-pane request/response
  layout.
- The separate useApiTestStore rather than extending the existing useTestCaseStore, to avoid
  bloating an already-large store.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Explicitly required stopPolling() to be called both in the component's useEffect cleanup and
  before starting a new run, after noticing the AI's first draft only handled the cleanup case
  and would have left a stale interval running if the user re-ran a test quickly.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | UI_API_TESTING_PLAN, useApiTestStore.js |

#### 4.6 Personal Comment

```text
The race-condition risk in polling cleanup is a good example of a UI bug class the AI tends to
under-specify (it handles the "happy path" cleanup but not the "user acts again before cleanup
runs" case) — this needed to be caught by manually walking through the interaction sequence.
```

---

### AI Usage Entry #11

| Field | Content |
|---|---|
| Date | 14/06/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Redesign the global UI design system from indigo/purple to a teal enterprise theme |
| Related Work | Frontend / UI Design |
| Usage Level | Moderate assistance |

#### 4.1 Prompt Used

```text
Replace every indigo/purple color reference across global.css, tailwind.config.js,
Sidebar.jsx, TopNavBar.jsx, and TestCaseDetailPage.jsx with a cohesive teal enterprise palette
inspired by Linear/Stripe/Vercel. Keep the existing iOS-style sliding active-nav-item
animation and the 3D elevated primary button, just re-skin the colors, shadows, and gradients.
List every token that changes.
```

#### 4.2 AI-Suggested Result

```text
The AI produced a full token table (Primary #1E707D, Primary Hover #278A99, Primary Dark
#165964, Accent Glow #4EC6D8, plus semantic success/warning/danger/info colors) and mapped
each token to the specific CSS variables, Tailwind config keys, and component-level styles
that needed updating.
```

#### 4.3 Parts Adopted From AI

```text
- The full color token table and its mapping to CSS variables / Tailwind config keys.
- The shadow system table (card, card-hover, sidebar, button, nav-active) kept proportionally
  consistent with the old indigo theme's depth hierarchy.
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Manually verified contrast ratios for text-on-primary and badge colors after the swap,
  since the AI's token table did not include an accessibility check.
- Iterated on the monochromatic purple → teal card depth/layering because the first teal pass
  looked visually flat; requested a revision with an explicit "Card hover" shadow tier to
  restore the depth hierarchy.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | UI.md, global.css, tailwind.config.js, Sidebar.jsx, TestCaseDetailPage.jsx |

#### 4.6 Personal Comment

```text
Re-skinning an existing, already-working animation/interaction system is a case where the AI
is efficient at systematic find-and-replace-style token work, but visual judgment calls
(depth, contrast, "does this still feel premium") still required iterating by eye.
```

---

### AI Usage Entry #12

| Field | Content |
|---|---|
| Date | 20/06/2026 |
| AI Tool | Antigravity (Kiro) |
| Purpose | Draft a PowerShell automation script and startup guide for the 5-service local stack |
| Related Work | Documentation / DevOps |
| Usage Level | Light assistance |

#### 4.1 Prompt Used

```text
Write a start-all.ps1 script that boots Kafka (docker compose), the Playwright HTTP server,
the Playwright Kafka worker, the Spring Boot backend, and the React frontend, each in its own
terminal window, with enough delay between them to respect the dependency order
(Kafka → Playwright Server → Worker → Backend → Frontend). Also write the accompanying
step-by-step manual startup guide as a fallback.
```

#### 4.2 AI-Suggested Result

```text
The AI produced the PowerShell script opening 4 separate terminal windows with staggered
Start-Sleep delays, plus a Markdown startup guide documenting the manual per-terminal
commands, health-check URLs, and an EADDRINUSE troubleshooting note.
```

#### 4.3 Parts Adopted From AI

```text
- The staggered terminal-launch approach and delay values as a starting point.
- The manual fallback guide structure (Terminal 1-5, required order, shutdown commands).
```

#### 4.4 Parts Self-Reviewed / Modified by the Student

```text
- Adjusted the delay values after testing on the actual dev machine, since the AI's default
  delays were not long enough for Kafka to be ready before the backend attempted to connect.
- Added the `taskkill /F /IM node.exe` troubleshooting step for the EADDRINUSE case based on
  an issue actually encountered during local testing, not suggested by the AI.
```

#### 4.5 Evidence

| Evidence Type | Content |
|---|---|
| Related Files | start-all.ps1, startup-guide.md |

#### 4.6 Personal Comment

```text
Low-risk, high-time-saving use of AI — mostly boilerplate scripting where the main student
contribution was calibrating timing values against the real local environment.
```

---
