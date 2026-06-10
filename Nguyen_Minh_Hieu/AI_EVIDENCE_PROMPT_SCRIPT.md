# AI Evidence Prompt Script - Nguyen Minh Hieu

## Cách dùng

File này dùng để tạo minh chứng screenshot cho 15 prompt quan trọng đã được tổng hợp trong `AI_AUDIT_LOG.md` và `PROMPTS.md`.

Gợi ý cách làm:

1. Mở một agent/chat AI khác.
2. Dán phần "Bối cảnh chung cho agent".
3. Hỏi lần lượt từng prompt từ 1 đến 15.
4. Chụp màn hình gồm prompt của bạn và phần trả lời của agent.
5. Đối chiếu nhanh câu trả lời với mục "Expected answer".

Lưu ý: Expected answer không cần giống từng chữ. Chỉ cần agent trả lời đúng ý chính, đúng timeline và không ghi những việc tương lai là đã hoàn thành.

---

## Bối cảnh chung cho agent

```text
Tôi là Nguyễn Minh Hiếu, sinh viên năm 2 ngành công nghệ thông tin, MSSV DE200322, nhóm 4 lớp SE20A11 môn SWP391. Nhóm tôi làm project DevTrack AI, một AI-assisted project workspace cho nhóm sinh viên IT. Tech stack gồm Spring Boot, PostgreSQL, Flyway, React/Vite, GitHub Integration. Phần tôi phụ trách chính gồm RTM live matrix/snapshot, Sprint Weekly Planning và Code Insight. Hãy trả lời như một AI assistant hỗ trợ tôi học và làm project, giải thích rõ nhưng không quá học thuật, và nhớ rằng tôi cần tự kiểm tra lại bằng code/test/commit.
```

---

## Prompt 1 - Project Idea Selection

### Prompt để hỏi agent

```text
Brainstorm cho tôi một ý tưởng project 9 tuần cho nhóm 5 người, có AI integration, scope vừa đủ lớn nhưng không quá nặng. Tập trung vào painpoint thật của sinh viên, đặc biệt là nhóm ngành sinh viên IT, phân tích các trường hợp mà nhóm có thể giải quyết được. Đưa ra nhiều lựa chọn khác nhau, phân tích điểm mạnh và điểm yếu của từng lựa chọn.
```

### Expected answer

```text
Agent nên gợi ý vài ý tưởng và nhấn mạnh hướng phù hợp nhất là workspace cho nhóm sinh viên IT, hỗ trợ quản lý requirement/task/test/evidence, traceability và báo cáo đóng góp. Không nên chỉ đề xuất task management chung chung.
```

### Minh chứng nên chụp

```text
Chụp đoạn agent gợi ý DevTrack AI hoặc AI workspace cho sinh viên IT, có nhắc pain point nhóm, traceability/evidence hoặc chứng minh đóng góp.
```

---

## Prompt 2 - Requirement, Use Case, ERD

### Prompt để hỏi agent

```text
Từ ý tưởng DevTrack AI, hãy phân tích giúp tôi requirement và use case chính. Tôi muốn hệ thống đi theo hướng requirement-centric, nghĩa là requirement phải trace được sang use case, task, test case, bug và evidence. Sau đó gợi ý luôn các entity database chính, nhưng đừng làm quá phức tạp vì nhóm em là sinh viên năm 2.
```

### Expected answer

```text
Agent nên trả lời actor như Leader, Member, Mentor, Admin, GitHub System, AI Engine; use case chính như quản lý requirement, task, test, evidence, RTM; entity như Requirement, UseCase, Task, TestCase, BugReport, Evidence, EvidenceLink, RTMSnapshot.
```

### Minh chứng nên chụp

```text
Chụp phần agent liệt kê actor/use case/entity và nói requirement là gốc traceability.
```

---

## Prompt 3 - Backend Foundation

### Prompt để hỏi agent

```text
Em đang setup backend Spring Boot cho DevTrack AI, dùng PostgreSQL và Flyway. Hãy review giúp cấu trúc cơ bản nên có những gì: controller, service, repository, entity, dto, migration. Em muốn làm đúng convention để sau này các module như RTM, Sprint, Code Insight không bị rối.
```

### Expected answer

```text
Agent nên gợi ý kiến trúc nhiều lớp: Controller mỏng, Service chứa business rule, Repository đọc/ghi DB, Entity map bảng, DTO cho request/response, Flyway migration cho schema. Nên nhắc không sửa migration cũ sau khi đã chạy.
```

### Minh chứng nên chụp

```text
Chụp phần agent nói rõ controller-service-repository-entity-dto và Flyway migration rule.
```

---

## Prompt 4 - Local Handoff Logs

### Prompt để hỏi agent

```text
Bạn đọc project hiện tại, rồi tạo giúp tôi vài file local để ghi lại context quan trọng qua từng lần làm việc với AI. Tôi không muốn lưu mọi prompt, chỉ muốn log các quyết định lớn, module nào đã làm, kỹ thuật gì đã dùng, và hướng handoff cho agent khác sau này.
```

### Expected answer

```text
Agent nên đề xuất các file kiểu AI_PROJECT_CONTEXT_LOG.md, MODULE_IMPLEMENTATION_TECHNIQUE_LOG.md và AGENT_HANDOFF_GUIDE.md, giải thích file nào ghi prompt/decision, file nào ghi stage kỹ thuật, file nào hướng dẫn agent sau.
```

### Minh chứng nên chụp

```text
Chụp phần agent đề xuất 3 file log/handoff và mục đích từng file.
```

---

## Prompt 5 - RTM Implementation

### Prompt để hỏi agent

```text
Tôi muốn implement module RTM theo plan đã thống nhất. RTM chỉ đọc dữ liệu từ requirement, task, test case, bug và evidence, không được tự sửa dữ liệu của module khác. Backend cần API live matrix, summary, detail và snapshot. Frontend theo feature-based structure và có thể tham khảo UI Stitch, nhưng phải khớp app hiện tại.
```

### Expected answer

```text
Agent nên đề xuất RTM read-only, API `/api/v1/projects/{projectId}/rtm`, summary/detail/snapshot, status như NOT_STARTED/IN_PROGRESS/AT_RISK/DONE, snapshot lưu JSON, frontend trong `features/rtm`.
```

### Minh chứng nên chụp

```text
Chụp phần agent nhấn mạnh RTM chỉ đọc dữ liệu và không mutate requirement/task/test/evidence.
```

---

## Prompt 6 - Sprint Weekly Planning

### Prompt để hỏi agent

```text
Dựa vào tài liệu bổ sung, hãy implement Sprint module nhưng chọn hướng Weekly + Sprint Planning View trước. Sprint chỉ quản lý sprint, assign task có sẵn vào sprint và plan ngày làm trong tuần. Không làm Daily View riêng và không làm AI Audit Tracker trong app v1.
```

### Expected answer

```text
Agent nên đề xuất Sprint CRUD, status update, assign/remove existing tasks, `tasks.sprint_plan_date`, weekly planner drag/drop, progress/capacity, và nhắc Task Board vẫn là nơi tạo/sửa task.
```

### Minh chứng nên chụp

```text
Chụp phần agent nói Sprint chỉ plan task có sẵn, không tạo task và không làm Daily View/AI Audit Tracker v1.
```

---

## Prompt 7 - Sprint Rule Hardening

### Prompt để hỏi agent

```text
Review giúp tôi các rule Sprint hiện tại. Tôi muốn tránh overlap sprint, chỉ có một active sprint trong một project, không cho API lấy task từ sprint khác, và weekly planner phải sync lại khi đổi sprint hoặc đổi tuần. Nếu có conflict với develop thì ưu tiên giữ đúng behavior task/sprint hiện tại.
```

### Expected answer

```text
Agent nên gợi ý service validation cho overlapping sprint, one ACTIVE sprint per project, reject reassign task thuộc sprint khác, validate status bắt buộc và reset/sync weekStart ở frontend.
```

### Minh chứng nên chụp

```text
Chụp phần agent liệt kê các business rule cần chặn ở backend service.
```

---

## Prompt 8 - Use Case Diagram And Script

### Prompt để hỏi agent

```text
Tôi cần làm phần use case diagram cho Module 5 gồm RTM, Code Insight và Mentor Review. Hãy review giúp actor nào nên để ngoài system boundary, actor nào không nên để. Sau đó viết giúp tôi script tiếng Việt ngắn để thuyết trình khoảng 4 slide.
```

### Expected answer

```text
Agent nên giải thích `System` không nên là actor, GitHub System là external actor, AI Engine có thể là external actor nếu là dịch vụ AI ngoài, Code Insight là module nội bộ. Có thể đưa script ngắn cho RTM/Code Insight/Mentor Review.
```

### Minh chứng nên chụp

```text
Chụp phần agent giải thích actor-boundary và script tiếng Việt ngắn.
```

---

## Prompt 9 - Jira Backfill

### Prompt để hỏi agent

```text
Nhóm em chưa maintain Jira từ đầu. Bạn hãy đọc git history, codebase hiện tại, các folder log/audit của từng thành viên và tài liệu planning để dựng lại task Jira hợp lý. Chỉ ghi task có evidence thật, có assignee, file/commit liên quan và acceptance criteria. Đừng tự bịa future task.
```

### Expected answer

```text
Agent nên nói cần dựa vào git history, file/module, commit, assignee và acceptance criteria. Nên cảnh báo không ghi task tương lai là Done nếu chưa có evidence.
```

### Minh chứng nên chụp

```text
Chụp phần agent đề xuất Jira issue breakdown có evidence và không bịa future task.
```

---

## Prompt 10 - Seed Data, Redis Cache, HashGeneratorRunner

### Prompt để hỏi agent

```text
Tôi seed data trực tiếp bằng pgAdmin, bảng projects và project_members có dữ liệu rồi nhưng UI My Projects vẫn không thấy project. Bạn kiểm tra giúp khả năng do backend cache hay lỗi membership. Ngoài ra file HashGeneratorRunner đang làm gì, có ảnh hưởng khi chạy app không?
```

### Expected answer

```text
Agent nên gợi ý kiểm tra Redis cache key của project list, membership/user id, clear cache hoặc refresh/re-login. Với HashGeneratorRunner, agent nên nói đây có thể là helper BCrypt hash, nếu có @Component/CommandLineRunner thì chạy mỗi startup và nên remove/disable nếu chỉ dùng seed.
```

### Minh chứng nên chụp

```text
Chụp phần agent nhắc Redis cache và HashGeneratorRunner startup risk.
```

---

## Prompt 11 - Code Insight Architecture

### Prompt để hỏi agent

```text
Hãy đọc lại report Code Insight hiện tại và viết lại cho dễ hiểu hơn. Tôi muốn kiến trúc không phụ thuộc hoàn toàn vào AI, có GitHub evidence, rule-based scoring, leader approval gate, audit snapshot, secret redaction, webhook async và ví dụ cụ thể để thầy cô dễ hiểu.
```

### Expected answer

```text
Agent nên đưa kiến trúc Code Insight gồm GitHub evidence, deterministic rule-based scoring, AI chỉ hỗ trợ semantic summary, leader là người approve/reject cuối, audit snapshot, webhook xử lý nhanh/async, redaction secret và ví dụ score/risk.
```

### Minh chứng nên chụp

```text
Chụp phần agent nói rõ Code Insight không phải AI-only và không auto-approve.
```

---

## Prompt 12 - Review Gate MVP

### Prompt để hỏi agent

```text
Bắt đầu Code Insight bằng slice nhỏ trước: task review gate MVP. Khi member chuyển task sang DONE, nếu project bật review gate thì task phải vào queue để leader approve/reject. Sau đó thêm project config cho Code Insight, gồm reviewGateEnabled và warning threshold. Đừng làm GitHub evidence hay AI vội.
```

### Expected answer

```text
Agent nên đề xuất task review decisions, approve/reject API, project settings `reviewGateEnabled` và threshold, TaskService chặn DONE trực tiếp khi gate bật. Agent nên nhắc chưa làm GitHub/AI ở phase này.
```

### Minh chứng nên chụp

```text
Chụp phần agent mô tả slice nhỏ review gate và config.
```

---

## Prompt 13 - Shared GitHub Integration Merge

### Prompt để hỏi agent

```text
Develop vừa có Issue Tracker GitHub config. Tôi không muốn Code Insight giữ một GitHub config riêng nữa. Hãy resolve merge theo hướng dùng chung github_integrations của Issue Tracker, xóa phần duplicate của Code Insight nếu cần, nhưng không được làm hỏng behavior Issue Tracker.
```

### Expected answer

```text
Agent nên khuyên dùng `github_integrations` làm source of truth, không giữ hai GitHub config systems, cleanup duplicate Code Insight GitHub repo/webhook config và giữ API/behavior Issue Tracker.
```

### Minh chứng nên chụp

```text
Chụp phần agent nhấn mạnh không duplicate GitHub config và không phá Issue Tracker.
```

---

## Prompt 14 - GitHub Evidence, Linking, Scoring, Drawer

### Prompt để hỏi agent

```text
Tiếp tục Code Insight theo architecture report. Phase này cần lưu GitHub code evidence từ webhook push, pull_request, workflow_run, check_run; sau đó link evidence vào task bằng task key hoặc GitHub issue rõ ràng. Tiếp theo scoring phải dùng được commit/PR/CI evidence và UI leader có drawer xem evidence. Làm từng phần đơn giản, có test, không gọi AI ở phase này.
```

### Expected answer

```text
Agent nên đề xuất raw webhook events, GitHubCommit/GitHubPullRequest/GitHubCheckRun, dispatcher/handlers, evidence link bằng explicit task key hoặc GitHub issue, scoring V2 có commit/PR/CI signals, evidence drawer read-only và tests. Không gọi AI ở phase này.
```

### Minh chứng nên chụp

```text
Chụp phần agent nói linking phải conservative/deterministic và không dùng AI semantic matching.
```

---

## Prompt 15 - Code Insight Phase 6-9 And Failed CI Risk

### Prompt để hỏi agent

```text
Tiếp tục Code Insight Phase 6-9. Tôi cần fetch changed files của PR khi leader mở evidence, tạo AI review summary dạng local/safe vì chưa có provider thật, lưu audit snapshot khi approve/reject và thêm dashboard metrics. Sau đó nếu test manual thấy failed CI mà vẫn READY thì sửa risk rule để failed CI phải BLOCKED.
```

### Expected answer

```text
Agent nên đề xuất fetch/cache changed files on demand, local safe AI summary không external provider, audit snapshot khi approve/reject, dashboard metrics, và failed CI/check là hard BLOCKED risk dù numeric score còn cao. Không auto-approve bằng AI.
```

### Minh chứng nên chụp

```text
Chụp phần agent nói failed CI phải BLOCKED và AI summary chỉ hỗ trợ leader.
```

---

## Checklist sau khi chụp minh chứng

| STT | Nội dung kiểm tra | Đã có screenshot? |
|---:|---|:---:|
| 1 | Ý tưởng DevTrack AI / AI workspace |  |
| 2 | Requirement-centric workflow + ERD |  |
| 3 | Backend layered architecture + Flyway |  |
| 4 | Local handoff logs |  |
| 5 | RTM read-only live matrix/snapshot |  |
| 6 | Sprint Weekly Planning scope |  |
| 7 | Sprint business rules |  |
| 8 | Use case actor-boundary + script |  |
| 9 | Jira backfill evidence rule |  |
| 10 | Redis cache + HashGeneratorRunner |  |
| 11 | Code Insight architecture |  |
| 12 | Review gate MVP |  |
| 13 | Shared GitHub Integration merge |  |
| 14 | GitHub evidence/linking/scoring/drawer |  |
| 15 | Patch/AI summary/snapshot/dashboard/CI risk |  |
