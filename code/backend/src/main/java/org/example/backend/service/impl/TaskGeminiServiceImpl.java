package org.example.backend.service.impl;

import org.example.backend.service.AiRoutingService;
import org.example.backend.service.TaskGeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TaskGeminiServiceImpl implements TaskGeminiService {

    private final AiRoutingService geminiService;

    @Autowired
    public TaskGeminiServiceImpl(AiRoutingService geminiService) {
        this.geminiService = geminiService;
    }

    @Override
    public String generateTasksBatch(String contextDataJson) {
        String prompt = "SYSTEM:\n" +
                "You are an expert Technical Project Manager. Your job is to break down Use Cases into logical technical tasks.\n\n" +
                "COMPLEXITY & DEADLINE RULES:\n" +
                "- Simple (UI fix, small API): 1-2 days.\n" +
                "- Medium (full feature): 3-5 days.\n" +
                "- Complex (module with multiple flows): 5-7 days.\n" +
                "- If a task takes > 7 days, YOU MUST split it into smaller sub-tasks.\n\n" +
                "WEIGHT RULES (Cognitive Complexity):\n" +
                "- 1.0: Routine/Basic (CRUD, simple UI, repetitive).\n" +
                "- 1.2 to 1.4: Moderate (Business logic, API integration).\n" +
                "- 1.5 to 1.7: High/Core (Core architecture, complex flows, optimization).\n" +
                "- 1.8 to 2.0: Critical/Extreme (Algorithms, security, integrations).\n\n" +
                "TASK TYPE CLASSIFICATION RULES:\n" +
                "- DEVELOPMENT: Building APIs, backend logic, DB setup, standard functional coding.\n" +
                "- UI_UX: Frontend layouts, HTML/CSS, React components, wireframing.\n" +
                "- TESTING: Writing unit/integration tests, QA, or defining test cases.\n" +
                "- DOCUMENTATION: Writing API Swagger docs, architecture documents, user guides.\n" +
                "- RESEARCH: Investigating libraries, Proof of Concept (POC), technical feasibility.\n" +
                "- DEPLOYMENT: Docker, CI/CD pipelines, server configuration.\n" +
                "- BUG_FIX: Resolving specific issues or refactoring bad code.\n" +
                "- REVIEW: Code review, architecture evaluation, security audit.\n\n" +
                "TIMELINE RULES (Strictly enforced):\n" +
                "- Base tasks (no dependencies) MUST have start_date = today.\n" +
                "- Dependent tasks MUST have start_date >= suggested_deadline of their depends_on tasks.\n" +
                "- start_date >= today AND suggested_deadline <= projectDeadline.\n" +
                "- The gap between start_date and suggested_deadline must realistically fit the estimated_hours (assume 8h/day).\n\n" +
                "PRIORITY RULES:\n" +
                "- Core tasks (Database, Core API) MUST inherit the exact priority of their parent Requirement.\n" +
                "- Secondary tasks (Documentation, minor UI) can be one level lower than the parent Requirement's priority.\n" +
                "- Bottleneck tasks (which many others depend on) should be elevated to HIGH or CRITICAL.\n\n" +
                "JSON FORMATTING RULES:\n" +
                "- Return JSON only. No extra text, no markdown code fences.\n" +
                "- DO NOT include comments inside the JSON.\n\n" +
                "USER:\n" +
                "Here is the context data:\n" +
                contextDataJson + "\n\n" +
                "Return ONLY a valid JSON object with the exact following structure:\n" +
                "{\n" +
                "  \"tasks\": [\n" +
                "    {\n" +
                "      \"temp_id\": \"Unique string like t1, t2\",\n" +
                "      \"requirement_code\": \"Code of the parent Requirement\",\n" +
                "      \"use_case_code\": \"Code of the parent Use Case\",\n" +
                "      \"title\": \"Clear technical action\",\n" +
                "      \"description\": \"Detailed scope and acceptance criteria\",\n" +
                "      \"estimated_hours\": 16.0,\n" +
                "      \"weight\": 1.5,\n" +
                "      \"task_type\": \"DEVELOPMENT | TESTING | DOCUMENTATION | UI_UX | RESEARCH | DEPLOYMENT | BUG_FIX | REVIEW\",\n" +
                "      \"priority\": \"LOW | MEDIUM | HIGH | CRITICAL\",\n" +
                "      \"start_date\": \"YYYY-MM-DD\",\n" +
                "      \"suggested_deadline\": \"YYYY-MM-DD\",\n" +
                "      \"depends_on\": [\"Array of temp_id, e.g. t1\"],\n" +
                "      \"suggested_assignee\": {\n" +
                "        \"member_name\": \"Name from members list\",\n" +
                "        \"reason\": \"Why this person?\"\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}";
        return geminiService.generateText(prompt);
    }

    @Override
    public String auditTasks(String contextDataJson) {
        String prompt = "SYSTEM:\n" +
                "You are an expert Technical Auditor. Your job is to review a freshly generated list of technical tasks against the original Use Cases and existing tasks.\n" +
                "Do not generate new tasks. Only analyze the provided tasks.\n\n" +
                "Identify risks in these specific categories:\n" +
                "1. Coverage Gaps: Are there any steps in the Use Case mainFlow/alternativeFlows that are not covered by any generated task?\n" +
                "2. Duplication Risks: Are any generated tasks potentially duplicating the scope of the Existing Tasks?\n" +
                "3. Technical & Workload Risks: Security vulnerabilities, architectural gaps, or severe workload imbalances.\n\n" +
                "JSON FORMATTING RULES:\n" +
                "- Return JSON only. No extra text, no markdown code fences.\n" +
                "- DO NOT include comments inside the JSON.\n\n" +
                "USER:\n" +
                "Here is the context data:\n" +
                contextDataJson + "\n\n" +
                "Return ONLY a valid JSON object with the exact following structure:\n" +
                "{\n" +
                "  \"ai_critical_assessment\": {\n" +
                "    \"coverage_gaps\": [\n" +
                "      {\n" +
                "        \"use_case_code\": \"UC-...\",\n" +
                "        \"missing_step\": \"Detailed description\",\n" +
                "        \"severity\": \"CRITICAL|HIGH|MEDIUM|LOW\",\n" +
                "        \"recommendation\": \"How to cover this gap\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"duplication_risks\": [\n" +
                "      {\n" +
                "        \"generated_task_temp_id\": \"t1\",\n" +
                "        \"existing_task_id\": \"TASK-123\",\n" +
                "        \"similarity_reason\": \"Why these are considered duplicates\",\n" +
                "        \"severity\": \"CRITICAL|HIGH|MEDIUM|LOW\",\n" +
                "        \"recommendation\": \"Actionable recommendation\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"identified_risks\": [\n" +
                "      {\n" +
                "        \"related_task_ids\": [\"t2\", \"t3\"],\n" +
                "        \"related_member_name\": \"Member Name\",\n" +
                "        \"risk\": \"Description of risk\",\n" +
                "        \"severity\": \"CRITICAL|HIGH|MEDIUM|LOW\",\n" +
                "        \"recommendation\": \"Actionable recommendation\"\n" +
                "      }\n" +
                "    ]\n" +
                "  }\n" +
                "}";
        return geminiService.generateText(prompt);
    }

    @Override
    public String splitTask(String taskDataJson) {
        String prompt = "SYSTEM:\n" +
                "You are an expert Technical Project Manager. Your job is to split a large task into smaller, manageable sub-tasks.\n\n" +
                "RULES:\n" +
                "- Sub-tasks MUST strictly inherit the exact priority of the original task.\n" +
                "- Sub-tasks MUST establish an execution order using 'depends_on'.\n" +
                "- If the task CANNOT be logically split (e.g., too small), return an empty array for sub_tasks AND provide a 'reason' string explaining why briefly.\n" +
                "- Return JSON only. No extra text.\n\n" +
                "USER:\n" +
                "Original Task data:\n" +
                taskDataJson + "\n\n" +
                "Return ONLY a valid JSON object of the sub-tasks:\n" +
                "{\n" +
                "  \"sub_tasks\": [\n" +
                "    {\n" +
                "      \"temp_id\": \"New unique string like sub1, sub2\",\n" +
                "      \"title\": \"Clear action\",\n" +
                "      \"description\": \"Detailed scope\",\n" +
                "      \"estimated_hours\": 8.0,\n" +
                "      \"task_type\": \"DEVELOPMENT | TESTING | DOCUMENTATION | UI_UX | RESEARCH | DEPLOYMENT | BUG_FIX | REVIEW\",\n" +
                "      \"priority\": \"Must match original\",\n" +
                "      \"suggested_deadline\": \"YYYY-MM-DD\",\n" +
                "      \"depends_on\": [\"Array of temp_id of OTHER sub-tasks it depends on\"]\n" +
                "    }\n" +
                "  ],\n" +
                "  \"reason\": \"(Optional) Explain briefly why it cannot be split if sub_tasks is empty\"\n" +
                "}";
        return geminiService.generateText(prompt);
    }

    @Override
    public String mergeTasks(String tasksDataJson) {
        String prompt = "SYSTEM:\n" +
                "You are an expert Technical Project Manager. Your job is to merge multiple small tasks into one comprehensive task.\n\n" +
                "RULES:\n" +
                "- Combine scopes without losing details.\n" +
                "- Establish a logical title and description.\n" +
                "- Sum the estimated_hours of all original tasks.\n" +
                "- If the tasks CANNOT be logically merged (e.g., completely unrelated), return null for merged_task AND provide a 'reason' string explaining why briefly.\n" +
                "- Return JSON only. No extra text.\n\n" +
                "USER:\n" +
                "Tasks to merge:\n" +
                tasksDataJson + "\n\n" +
                "Return ONLY a valid JSON object of the merged task:\n" +
                "{\n" +
                "  \"merged_task\": {\n" +
                "    \"temp_id\": \"New unique string like merged1\",\n" +
                "    \"title\": \"Combined action\",\n" +
                "    \"description\": \"Combined detailed scope\",\n" +
                "    \"estimated_hours\": 16.0,\n" +
                "    \"task_type\": \"DEVELOPMENT | TESTING | DOCUMENTATION | UI_UX | RESEARCH | DEPLOYMENT | BUG_FIX | REVIEW\",\n" +
                "    \"priority\": \"Highest priority among merged tasks\",\n" +
                "    \"suggested_deadline\": \"YYYY-MM-DD\"\n" +
                "  },\n" +
                "  \"reason\": \"(Optional) Explain briefly why they cannot be merged if merged_task is null\"\n" +
                "}";
        return geminiService.generateText(prompt);
    }
}
