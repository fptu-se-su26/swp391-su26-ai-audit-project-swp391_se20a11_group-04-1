# Technical Design: AI Selector Enrichment via GitHub Source Scan

## Feature Overview

Khi AI gen test case, nó không biết selector thật của app và tự đặt tên tùy tiện (vd `[data-testid='email-input']` mà thực tế không tồn tại). Tính năng này giải quyết bằng cách trước khi gọi Gemini, backend sẽ clone GitHub repo của project, scan toàn bộ file `.jsx/.tsx/.vue/.html`, extract các interactive element attributes (`data-testid`, `id`, `name`, `aria-label`, `placeholder`), nhóm theo file/route, rồi nhét kết quả vào prompt — để AI gen ra selector chính xác từ source code thật.

**Scope**: Chỉ can thiệp vào pipeline AI gen test case. Không đụng đến `testRunConsumer.js`, `templateEngine.js`, `worker.js`, hay bất kỳ file nào trong runtestcase pipeline.

---

## High-Level Design

### Luồng hiện tại

```
User click "Generate" (AiGenTestCaseModal)
    ↓ POST /api/v1/projects/{id}/test-cases/generate-ai
    ↓ TestCaseController.generateTestCasesWithAi()
    ↓ AiTestCaseGeneratorService.generateTestCases(request)
    ↓ buildPrompt(testType, smartMode, requirementContext, useCaseContext, additionalContext)
    ↓ callGemini(prompt)
    ↓ AI tự đoán selector → [data-testid='email-input'] (có thể sai)
```

### Luồng mới sau khi implement

```
User click "Generate" + toggle "Enrich with Source Selectors"
    ↓ POST /api/v1/projects/{id}/test-cases/generate-ai
      { requirementId, testType, ..., enrichWithSelectors: true }
    ↓ TestCaseController.generateTestCasesWithAi()
    ↓ [NEW] nếu enrichWithSelectors=true:
        ↓ ArchitectureSyncService lấy repoUrl + decryptedToken của project
        ↓ POST http://architecture-parser:4002/extract-selectors
          { repoUrl, token, branch }
        ↓ Architecture Parser: clone repo → scan .jsx/.tsx → extract attrs → cleanup
        ↓ Trả về SelectorMap: { "src/pages/LoginPage.jsx": ["[data-testid='email']", ...] }
    ↓ AiTestCaseGeneratorService.generateTestCases(request, selectorContext)
    ↓ buildPrompt(..., selectorContext)  ← thêm section SOURCE CODE SELECTORS
    ↓ callGemini(prompt)
    ↓ AI biết chính xác selector → gen đúng
```

### Component Diagram

```
┌─────────────────────────────────────┐
│           Frontend                  │
│  AiGenTestCaseModal.jsx             │
│  + toggle "Enrich with Selectors"   │
│  + enrichWithSelectors: boolean     │
└──────────────┬──────────────────────┘
               │ POST generate-ai
               ▼
┌─────────────────────────────────────┐
│           Backend (Spring Boot)     │
│                                     │
│  TestCaseController                 │
│    ↓ enrichWithSelectors?           │
│  SelectorEnrichmentService [NEW]    │
│    ↓ getRepoInfo(projectId, userId) │  ← dùng GitHubIntegrationService đã có
│    ↓ callExtractSelectors(url,tok)  │  ← gọi architecture-parser
│    ↓ returns SelectorMap            │
│  AiTestCaseGeneratorService         │
│    ↓ buildPrompt(+ selectorContext) │
│    ↓ callGemini()                   │
└──────────────┬──────────────────────┘
               │ POST /extract-selectors
               ▼
┌─────────────────────────────────────┐
│     Architecture Parser (FastAPI)   │
│     port 4002                       │
│                                     │
│  POST /extract-selectors [NEW]      │
│    ↓ CloneService.clone()  (có sẵn) │
│    ↓ SelectorScanService  [NEW]     │
│       scan .jsx/.tsx/.vue/.html     │
│       regex extract attrs           │
│       group by file path            │
│    ↓ CloneService.cleanup()         │
│    ↓ return SelectorMap JSON        │
└─────────────────────────────────────┘
```

---

## Low-Level Design

### 1. Architecture Parser — `services/selector_scan_service.py` [NEW]

**Mục đích**: Scan toàn bộ frontend source files, extract interactive element attributes.

```python
class SelectorScanService:
    # File extensions cần scan
    FRONTEND_EXTS = {'.jsx', '.tsx', '.vue', '.html', '.htm'}

    # Directories cần bỏ qua (giống ParserService.EXCLUDED_DIRS)
    EXCLUDED_DIRS = {'node_modules', '.git', 'dist', 'build', '.next', 'venv'}

    # Regex patterns để extract attributes
    ATTR_PATTERNS = [
        r'data-testid=["\']([^"\']+)["\']',   # data-testid="submit-btn"
        r'id=["\']([^"\']+)["\']',              # id="email-input"
        r'name=["\']([^"\']+)["\']',            # name="password"
        r'aria-label=["\']([^"\']+)["\']',      # aria-label="Close dialog"
        r'placeholder=["\']([^"\']+)["\']',     # placeholder="Enter email"
    ]

    @staticmethod
    def scan(clone_dir: str) -> dict:
        """
        Returns:
        {
          "src/pages/LoginPage.jsx": {
            "data-testid": ["email-input", "password-input", "submit-btn"],
            "id": ["email", "password"],
            "aria-label": ["Close dialog"],
            "placeholder": ["Enter your email"]
          },
          ...
        }
        """
```

**Logic chi tiết**:
- Walk qua `clone_dir`, bỏ qua `EXCLUDED_DIRS`
- Với mỗi file có extension trong `FRONTEND_EXTS`: đọc content, chạy từng regex trong `ATTR_PATTERNS`
- Collect unique values, group theo relative file path
- Giới hạn: nếu `len(result) > 200 files` thì chỉ lấy 200 file đầu (tránh prompt quá dài)
- Giới hạn: mỗi file tối đa 50 unique selectors

**Output format để nhét vào prompt**:
```python
@staticmethod
def format_for_prompt(selector_map: dict) -> str:
    """
    Converts selector_map thành text block ngắn gọn cho Gemini:
    
    src/pages/LoginPage.jsx:
      data-testid: email-input, password-input, login-submit-btn
      placeholder: Enter email, Enter password
    
    src/pages/DashboardPage.jsx:
      data-testid: create-project-btn, project-list-item, ...
    """
```

---

### 2. Architecture Parser — `main.py` — Endpoint mới

```python
class ExtractSelectorsRequest(BaseModel):
    repoUrl: str
    token: str = None
    branch: str = "main"

@app.post("/extract-selectors")
async def extract_selectors(request: ExtractSelectorsRequest):
    """
    Clone repo → scan frontend files → extract selectors → cleanup → return map.
    
    Returns:
    {
        "selectorMap": {
            "src/pages/LoginPage.jsx": {
                "data-testid": ["email-input", "submit-btn"],
                "placeholder": ["Enter email"]
            }
        },
        "totalFiles": 42,
        "totalSelectors": 156
    }
    """
    clone_dir = None
    try:
        # Dùng DummyReporter vì không cần progress tracking cho endpoint này
        clone_dir = CloneService.clone(
            repo_url=request.repoUrl,
            token=request.token,
            branch=request.branch,
            project_id=0,           # dummy project_id
            reporter=DummyReporter()
        )
        selector_map = SelectorScanService.scan(clone_dir)
        stats = SelectorScanService.compute_stats(selector_map)
        return {"selectorMap": selector_map, **stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if clone_dir:
            CloneService.cleanup(clone_dir)
```

**DummyReporter** (thêm vào `services/progress_reporter.py` hoặc inline):
```python
class DummyReporter:
    def report(self, *args, **kwargs):
        pass  # No-op, không cần gửi progress cho selector scan
```

---

### 3. Backend — `dto/testing/AiTestCaseGenerateRequest.java` — Thêm field

```java
@Data
public class AiTestCaseGenerateRequest {
    private TestType testType;

    @NotNull(message = "Requirement is required for AI generation")
    private Long requirementId;

    private String additionalContext;
    private boolean smartMode = false;
    private boolean discardExisting = false;

    // [NEW] Nếu true, backend sẽ clone GitHub repo và extract selectors
    private boolean enrichWithSelectors = false;
}
```

---

### 4. Backend — `service/SelectorEnrichmentService.java` [NEW]

**Mục đích**: Orchestrate việc lấy GitHub info → gọi architecture-parser → trả về selectorContext string.

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class SelectorEnrichmentService {

    @Value("${architecture.parser.url:http://localhost:4002}")
    private String architectureParserUrl;

    private final GitHubIntegrationService gitHubIntegrationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Gọi architecture-parser để extract selectors từ GitHub repo của project.
     * 
     * @return formatted string để nhét vào Gemini prompt, hoặc null nếu không có GitHub
     */
    public String extractSelectorContext(Long projectId, Long userId) {
        try {
            GitHubIntegration integration = gitHubIntegrationService.getIntegration(projectId, userId);
            if (integration == null) {
                log.info("Project {} has no GitHub integration, skipping selector enrichment", projectId);
                return null;
            }

            String decryptedToken = gitHubIntegrationService.getDecryptedUserToken(userId);
            if (decryptedToken == null || decryptedToken.isBlank()) {
                log.info("User {} has no GitHub token, skipping selector enrichment", userId);
                return null;
            }

            String repoUrl = String.format("https://github.com/%s/%s",
                    integration.getRepoOwner(), integration.getRepoName());

            // POST to architecture-parser /extract-selectors
            Map<String, Object> payload = Map.of(
                "repoUrl", repoUrl,
                "token", decryptedToken,
                "branch", "main"
            );

            ResponseEntity<Map> response = restTemplate.postForEntity(
                architectureParserUrl + "/extract-selectors",
                new HttpEntity<>(payload, jsonHeaders()),
                Map.class
            );

            if (response.getBody() == null) return null;

            Map<String, Object> selectorMap = (Map<String, Object>) response.getBody().get("selectorMap");
            if (selectorMap == null || selectorMap.isEmpty()) return null;

            return formatSelectorMapForPrompt(selectorMap);

        } catch (Exception e) {
            // Fail gracefully — nếu enrich fail thì vẫn gen được test case (không có selector hint)
            log.warn("Selector enrichment failed for project {}: {}", projectId, e.getMessage());
            return null;
        }
    }

    private String formatSelectorMapForPrompt(Map<String, Object> selectorMap) {
        StringBuilder sb = new StringBuilder();
        sb.append("SOURCE CODE SELECTORS (extracted from GitHub frontend source):\n");
        sb.append("Use these EXACT attributes in your test case selectors. Do not invent selectors not listed here.\n\n");

        int fileCount = 0;
        for (Map.Entry<String, Object> entry : selectorMap.entrySet()) {
            if (fileCount++ > 50) {  // tránh prompt quá dài
                sb.append("... (").append(selectorMap.size() - 50).append(" more files)\n");
                break;
            }
            sb.append("File: ").append(entry.getKey()).append("\n");
            Map<String, List<String>> attrs = (Map<String, List<String>>) entry.getValue();
            for (Map.Entry<String, List<String>> attr : attrs.entrySet()) {
                sb.append("  ").append(attr.getKey()).append(": ")
                  .append(String.join(", ", attr.getValue())).append("\n");
            }
        }
        return sb.toString();
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");
        return headers;
    }
}
```

---

### 5. Backend — `TestCaseController.java` — Thêm enrichment step

Thêm `SelectorEnrichmentService` vào controller và chèn logic trước khi gọi `generateTestCases`:

```java
// Inject thêm
private final SelectorEnrichmentService selectorEnrichmentService;

// Trong generateTestCasesWithAi():
@PostMapping("/generate-ai")
@PreAuthorizeProjectMember
public ApiResponse<Map<String, Object>> generateTestCasesWithAi(
        @PathVariable Long projectId,
        @Valid @RequestBody AiTestCaseGenerateRequest request,
        Principal principal) {

    UserAccount user = userAccountRepository.findByUsername(principal.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    // 1. Validate constraints and save PROCESSING staging
    AiGenerationStaging staging = aiTestCaseGeneratorService.createProcessingStaging(request, projectId);

    try {
        // [NEW] 2. Enrich with selectors nếu được yêu cầu
        String selectorContext = null;
        if (request.isEnrichWithSelectors()) {
            selectorContext = selectorEnrichmentService.extractSelectorContext(projectId, user.getId());
        }

        // 3. Call Gemini (truyền thêm selectorContext)
        AiTestCaseGenerateResponse generatedData =
                aiTestCaseGeneratorService.generateTestCases(request, selectorContext);

        // 4-5. (Giữ nguyên logic staging, response như cũ)
        ...
    }
}
```

---

### 6. Backend — `AiTestCaseGeneratorService.java` — Nhận selectorContext

**Thay đổi signature** của `generateTestCases` và `buildPrompt`:

```java
// Signature cũ
public AiTestCaseGenerateResponse generateTestCases(AiTestCaseGenerateRequest request)

// Signature mới (backward compatible)
public AiTestCaseGenerateResponse generateTestCases(
        AiTestCaseGenerateRequest request,
        String selectorContext)   // null nếu không enrich
```

**Trong `buildPrompt()`**, thêm section mới ở STEP 6:

```java
private String buildPrompt(TestType testType, boolean smartMode, String requirementContext,
                           String useCaseContext, String additionalContext,
                           String selectorContext) {  // [NEW param]
    // ... (giữ nguyên toàn bộ prompt hiện tại) ...

    // Chèn vào STEP 6 — Build Understanding:
    String selectorSection = "";
    if (selectorContext != null && !selectorContext.isBlank()) {
        selectorSection =
            "====================================================\n" +
            "STEP 6b — Source Code Selector Map (GitHub)\n" +
            "====================================================\n" +
            selectorContext + "\n\n" +
            "CRITICAL RULE: For UI test cases, ONLY use selectors listed in the SOURCE CODE SELECTORS above.\n" +
            "If a selector for a needed element is NOT in the list, use the best available alternative\n" +
            "(e.g., role-based: button:has-text('Login'), or placeholder-based).\n\n";
    }

    // Chèn selectorSection vào trước OUTPUT FORMAT section
    return basePrompt + selectorSection + outputFormatSection + inputDataSection;
}
```

---

### 7. Frontend — `AiGenTestCaseModal.jsx` — Thêm toggle

Thêm UI option "Enrich with Source Selectors" vào phần Advanced Options:

```jsx
// State mới
const [enrichWithSelectors, setEnrichWithSelectors] = useState(false)

// Trong payload khi submit
const payload = {
    testType: testType === 'AI Decides' ? null : testType,
    smartMode: testType === 'AI Decides',
    requirementId: parseInt(requirementId),
    additionalContext,
    discardExisting: false,
    enrichWithSelectors,  // [NEW]
}

// UI trong Advanced Options section:
<div style={{ marginTop: 12 }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
            type="checkbox"
            checked={enrichWithSelectors}
            onChange={(e) => setEnrichWithSelectors(e.target.checked)}
        />
        <span style={{ fontSize: 13, color: C.textPri, fontWeight: 500 }}>
            Enrich with Source Selectors
        </span>
    </label>
    <p style={{ margin: '4px 0 0 22px', fontSize: 12, color: C.textSec }}>
        AI will scan your GitHub source code to find real data-testid, id, and name attributes.
        Requires GitHub integration. Adds ~20–30s to generation time.
    </p>
</div>
```

---

## Data Flow Diagram

```
AiGenTestCaseModal
│  enrichWithSelectors: true
│  requirementId: 42
│
▼ POST /api/v1/projects/7/test-cases/generate-ai
│
TestCaseController
│  user = getCurrentUser()
│  staging = createProcessingStaging()
│
├──[enrichWithSelectors=true]──▶ SelectorEnrichmentService
│                                │  gitHubIntegrationService.getIntegration(7, userId)
│                                │    → repoOwner="team04", repoName="frontend-app"
│                                │  getDecryptedUserToken(userId)
│                                │    → "ghp_xxx..."
│                                │  POST http://architecture-parser:4002/extract-selectors
│                                │    { repoUrl, token, branch: "main" }
│                                │
│                                │  Architecture Parser:
│                                │    CloneService.clone() → /tmp/devtrack_repo_...
│                                │    SelectorScanService.scan(clone_dir)
│                                │      → walk .jsx/.tsx files
│                                │      → regex extract data-testid/id/name/...
│                                │      → group by file
│                                │    CloneService.cleanup()
│                                │    return { selectorMap: {...} }
│                                │
│                                └──▶ selectorContext (formatted string)
│
▼
AiTestCaseGeneratorService.generateTestCases(request, selectorContext)
│  buildPrompt(... + selectorContext)
│    → prompt bao gồm section:
│      "SOURCE CODE SELECTORS:
│       src/pages/LoginPage.jsx:
│         data-testid: email-input, password-input, login-btn
│       ..."
│  callGemini(prompt)
│    → AI tạo: { "selector": "[data-testid='email-input']" }  ← ĐÚNG
│
▼
Response: { testCases: [...], generationId: "uuid" }
```

---

## Error Handling Strategy

| Scenario | Behavior |
|---|---|
| Project không có GitHub integration | `enrichWithSelectors` bị ignore, gen bình thường không có selector hint |
| User không có GitHub token | Như trên |
| Architecture Parser down / timeout (30s) | Fail gracefully, log warning, gen bình thường |
| Repo rỗng / không có .jsx/.tsx file | SelectorMap rỗng → không thêm section vào prompt |
| Clone thất bại (private repo, sai token) | Fail gracefully, log warning |
| selectorContext quá dài (>5000 chars) | Truncate và thêm note "(truncated)" |

**Không có case nào block việc gen test case.** Enrichment là best-effort — fail thì gen bình thường.

---

## File Checklist

### Architecture Parser (Python)
- [ ] `services/selector_scan_service.py` — class `SelectorScanService` với methods: `scan()`, `format_for_prompt()`, `compute_stats()`
- [ ] `services/progress_reporter.py` — thêm class `DummyReporter`
- [ ] `main.py` — thêm `ExtractSelectorsRequest` model và `POST /extract-selectors` endpoint

### Backend (Java/Spring Boot)
- [ ] `dto/testing/AiTestCaseGenerateRequest.java` — thêm field `enrichWithSelectors: boolean`
- [ ] `service/SelectorEnrichmentService.java` — service mới, inject `GitHubIntegrationService` và `RestTemplate`
- [ ] `service/AiTestCaseGeneratorService.java` — sửa `generateTestCases()` và `buildPrompt()` nhận `selectorContext`
- [ ] `controller/testing/TestCaseController.java` — inject `SelectorEnrichmentService`, gọi trong `generateTestCasesWithAi()`

### Frontend (React)
- [ ] `features/testing/components/AiGenTestCaseModal.jsx` — thêm state `enrichWithSelectors`, toggle UI, truyền vào payload

---

## Implementation Order

1. **Architecture Parser** — `selector_scan_service.py` + `/extract-selectors` endpoint (test độc lập bằng curl)
2. **Backend DTO** — thêm field `enrichWithSelectors`
3. **Backend Service** — `SelectorEnrichmentService`
4. **Backend Service** — sửa `AiTestCaseGeneratorService.buildPrompt()`
5. **Backend Controller** — wire up trong `TestCaseController`
6. **Frontend** — toggle trong `AiGenTestCaseModal`
7. **Integration test** — test end-to-end với một project có GitHub integration thật

---

## Assumptions & Constraints

- Frontend project của SWP391 nhóm dùng React (`.jsx`/`.tsx`) và có convention đặt `data-testid` — đây là target primary. `id`, `name`, `aria-label`, `placeholder` là fallback.
- Architecture Parser đang chạy tại URL được config trong `application.yaml` (key `architecture.parser.url`). Nếu chưa có key này, mặc định `http://localhost:4002`.
- Clone operation sẽ tốn khoảng 15–30s tùy kích thước repo. Frontend cần thể hiện loading state rõ ràng ("Scanning source code...").
- Token được lấy từ `UserGithubToken` của user đang trigger (giống flow Architecture Sync hiện tại) — không lưu thêm credential nào.
- `enrichWithSelectors = false` là default — không thay đổi behavior hiện tại, hoàn toàn backward compatible.
