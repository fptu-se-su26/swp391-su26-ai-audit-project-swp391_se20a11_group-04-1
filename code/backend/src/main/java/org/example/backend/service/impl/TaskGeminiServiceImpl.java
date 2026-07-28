package org.example.backend.service.impl;

import org.example.backend.service.AiRoutingService;
import org.example.backend.service.TaskGeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

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
                "Act as a Principal Software Architect and Senior Technical Leader with 10+ years of experience in enterprise systems.\n" +
                "Your objective is to comprehensively decompose Use Cases (UC) and Non-Functional Requirements (RE) into a strictly EXHAUSTIVE, production-ready pipeline of technical tasks.\n\n" +
                "DUPLICATION PREVENTION RULES (CRITICAL):\n" +
                "- Analyze the provided 'existingTasks' list meticulously.\n" +
                "- WARNING: Tasks like 'Design Use Case', 'Identify Requirements', or 'Research' DO NOT mean the feature is fully implemented. They are just preliminary steps.\n" +
                "- You MUST generate the actual DEVELOPMENT, TESTING, and UI_UX tasks for the UC/RE. Do NOT skip a UC/RE unless its ACTUAL technical implementation (APIs, UI, DB, Tests) is fully covered by existing tasks.\n\n" +
                "EXHAUSTIVE TASK DECOMPOSITION RULES (CRITICAL):\n" +
                "- You MUST NOT provide a superficial or high-level list. You must break down every Use Case and Requirement comprehensively across ALL architectural layers (Database, Backend API, Frontend UI, Integration, Testing, DevOps).\n" +
                "- If a Use Case is full-stack, you MUST generate at LEAST 3-4 specialized tasks (e.g., 1. DB Schema/Migration -> 2. Backend API & Logic -> 3. Frontend UI & Integration -> 4. Automated Testing).\n" +
                "- You MUST link the generated task exactly to its parent 'use_case_code' (if it belongs to a UC) or 'requirement_code' (if it belongs to an RE).\n" +
                "- Task Titles MUST use strict, professional phrasing: [Action Verb] [Target Component] for [Business Context] (e.g., 'Implement REST API for User Registration', 'Design Database Schema for Order Management').\n" +
                "- Dependencies (`depends_on`) MUST be strictly logical. Frontend tasks MUST depend on Backend tasks. Testing tasks MUST depend on the implementation tasks they verify.\n" +
                "- Testing tasks MUST NOT be vague. DO NOT write 'QA' alone. Use explicit titles like 'Write Unit Tests for Payment Service' or 'Execute E2E Testing for Checkout Flow'.\n" +
                "- For Non-Functional Requirements, generate precise DevOps, Security, or Architectural configuration tasks.\n\n" +
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
                "- DEVELOPMENT: Building APIs, backend logic, DB schema design/migration, standard functional coding.\n" +
                "- UI_UX: Frontend layouts, HTML/CSS, React components, wireframing, UI state management.\n" +
                "- TESTING: Writing specific, scoped tests. Task titles MUST clearly state the test type and scope. Examples:\n" +
                "    * 'Write Unit Tests for [Service/Function Name]'\n" +
                "    * 'Write Integration Tests for [Module/Flow Name]'\n" +
                "    * 'Write E2E Test Cases for [Feature Name]'\n" +
                "    * 'Define Test Cases for [Use Case Name]'\n" +
                "  DO NOT use vague titles like 'QA', 'Testing', or 'Test the feature'.\n" +
                "- DOCUMENTATION: Writing API Swagger/OpenAPI docs, architecture documents, user guides, README files.\n" +
                "- RESEARCH: Investigating third-party libraries, Proof of Concept (POC), technical feasibility analysis.\n" +
                "- DEPLOYMENT: Docker setup, CI/CD pipeline configuration, server setup, environment configuration.\n" +
                "- BUG_FIX: Resolving specific defects or refactoring problematic/legacy code.\n" +
                "- REVIEW: Code review, architecture evaluation, security audit, peer review.\n\n" +
                "TIMELINE RULES (Strictly enforced):\n" +
                "- NEVER generate past dates. start_date MUST BE >= today's date: " + LocalDate.now().toString() + ". DO NOT generate a date before today.\n" +
                "- suggested_deadline MUST BE >= start_date.\n" +
                "- Base tasks (no dependencies) MUST have start_date = today's date: " + LocalDate.now().toString() + " or later.\n" +
                "- Dependent tasks MUST have start_date >= suggested_deadline of their depends_on tasks.\n" +
                "- suggested_deadline MUST NOT exceed projectDeadline.\n" +
                "- CRITICAL BOUNDARY RULE: If a task belongs to a Use Case, its start_date and suggested_deadline MUST fall strictly within that Use Case's start_date and deadline.\n" +
                "- If a task belongs to a Requirement (and no Use Case), its dates MUST fall strictly within that Requirement's start_date and deadline.\n" +
                "- The gap between start_date and suggested_deadline MUST strictly fit the estimated_hours (assume max 8h/day). E.g., a 40h task MUST have at least a 5-day gap!\n\n" +
                "PRIORITY RULES:\n" +
                "- Core tasks (Database, Core API) MUST inherit the exact priority of their parent Requirement.\n" +
                "- Secondary tasks (Documentation, minor UI) can be one level lower than the parent Requirement's priority.\n" +
                "- Bottleneck tasks (which many others depend on) should be elevated to HIGH or CRITICAL.\n\n" +
                "ASSIGNMENT RULES:\n" +
                "- You MUST assign a 'suggested_assignee' to every task.\n" +
                "- Balance the workload evenly among members based on their 'current_task_count' and 'current_workload_weight'. Assign new tasks to members with the lowest workload first.\n" +
                "- Ignore their role completely for assignment. The ONLY priority is balancing workload and difficulty (weight) fairly.\n" +
                "- The 'member_name' in 'suggested_assignee' MUST EXACTLY match the 'username' field of the chosen member.\n\n" +
                "CHECKLIST RULES (DEFINITION OF DONE):\n" +
                "- You MUST generate 3 to 5 'checklists' items for each task. These act as a rigorous Definition of Done (DoD).\n" +
                "- Backend checklists MUST include: input validation, proper HTTP status codes, authentication/authorization check, error handling, and unit test coverage.\n" +
                "- Frontend checklists MUST include: responsive layout, API error handling, loading/empty states, and form validation feedback.\n" +
                "- DB checklists MUST include: correct data types, NOT NULL constraints, foreign keys, indexes on frequently queried columns, and migration file created.\n" +
                "- TESTING checklists MUST include: test cases defined for happy path, edge cases, and error/failure scenarios. Must specify the exact method or endpoint being tested.\n\n" +
                "JSON FORMATTING RULES:\n" +
                "- Return JSON only. No extra text, no markdown code fences.\n" +
                "- DO NOT include comments inside the JSON.\n" +
                "- ALL text outputs (title, description, checklists, reason) MUST be strictly in English.\n\n" +
                "USER:\n" +
                "Here is the context data:\n" +
                contextDataJson + "\n\n" +
                "Return ONLY a valid JSON object with the exact following structure:\n" +
                "{\n" +
                "  \"tasks\": [\n" +
                "    {\n" +
                "      \"temp_id\": \"Unique string like t1, t2\",\n" +
                "      \"requirement_code\": \"Code of the parent Requirement\",\n" +
                "      \"use_case_code\": \"Code of the parent Use Case (Can be null or empty for non-functional requirements)\",\n" +
                "      \"module_name\": \"MUST use the 'moduleName' provided in the UseCase context. If no module is provided or context is missing, infer a high-level module (e.g. Authentication, Security, User Management). If a module has no tasks, it will naturally be excluded.\",\n" +
                "      \"title\": \"Clear technical action\",\n" +
                "      \"description\": \"Detailed scope and acceptance criteria\",\n" +
                "      \"checklists\": [\"Actionable step 1\", \"Actionable step 2\", \"Actionable step 3\"],\n" +
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
                "You are an expert Technical Auditor. Your job is to review a freshly generated list of technical tasks against the original Use Cases, Non-Functional Requirements, and existing tasks.\n" +
                "Do not generate new tasks. Only analyze the provided tasks.\n" +
                "CRITICAL INSTRUCTION: All your outputs (missing_step, similarity_reason, recommendation, risk) MUST be in English. Be extremely concise and direct.\n\n" +
                "Identify risks in these specific categories:\n" +
                "1. Coverage Gaps: Are there any steps in the Use Case flows, or any core scopes in the Non-Functional Requirements that are not covered by any generated task?\n" +
                "2. Duplication Risks: Are any generated tasks potentially duplicating the scope of the Existing Tasks? CRITICAL: If the Existing Tasks list is empty, you MUST return an empty array for duplication_risks. NEVER flag duplicates against other newly generated tasks in the same batch.\n" +
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
                "        \"use_case_code\": \"UC-... (or Requirement Code if no UC)\",\n" +
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
                "You are an AI that ONLY outputs JSON. Your sole purpose is to forcibly slice a task into 2 or more smaller sub-tasks.\n\n" +
                "CRITICAL INSTRUCTIONS (FAILURE IS NOT AN OPTION):\n" +
                "1. You MUST return a JSON object with a 'sub_tasks' array containing AT LEAST 2 items.\n" +
                "2. NEVER return an empty array []. NEVER return a 'reason'. NEVER refuse to split.\n" +
                "3. If the task is already extremely small (e.g., 'Update color to red'), you MUST still split it by phases. For example: Subtask 1: 'Research exact hex code', Subtask 2: 'Apply color code to CSS'.\n" +
                "4. All text outputs MUST be strictly in English.\n" +
                "5. Inherit priority exactly.\n" +
                "6. Sub-tasks MUST establish an execution order using 'depends_on'.\n" +
                "7. Provide 3-5 'checklists' per sub-task.\n" +
                "8. NEVER generate past dates. start_date MUST BE >= today.\n" +
                "9. suggested_deadline MUST BE >= start_date.\n" +
                "10. Dependent tasks MUST have start_date >= suggested_deadline of their depends_on tasks.\n" +
                "11. CRITICAL BOUNDARY RULE: The start_date and suggested_deadline of the sub-tasks MUST fall strictly within the start_date and deadline of the original Task provided below.\n" +
                "12. The gap between start_date and suggested_deadline MUST strictly fit the estimated_hours (assume max 8h/day). E.g., a 40h task MUST have at least a 5-day gap! Try your best to calculate this.\n\n" +
                "EXAMPLE OF FORCED SPLITTING FOR A TINY TASK:\n" +
                "Input: {\"title\": \"Change button color to red\", \"description\": \"Update the hex code.\"}\n" +
                "Output:\n" +
                "{\n" +
                "  \"sub_tasks\": [\n" +
                "    {\"temp_id\": \"sub1\", \"title\": \"Determine hex code\", \"description\": \"Find the exact red hex code.\", \"checklists\": [\"Get color code\"], \"estimated_hours\": 0.5, \"weight\": 1.0, \"task_type\": \"RESEARCH\", \"priority\": \"LOW\"},\n" +
                "    {\"temp_id\": \"sub2\", \"title\": \"Update CSS\", \"description\": \"Change the color in CSS file.\", \"checklists\": [\"Modify code\", \"Test\"], \"estimated_hours\": 0.5, \"weight\": 1.0, \"task_type\": \"DEVELOPMENT\", \"priority\": \"LOW\", \"depends_on\": [\"sub1\"]}\n" +
                "  ]\n" +
                "}\n\n" +
                "USER:\n" +
                "Original Task data:\n" +
                taskDataJson + "\n\n" +
                "Return ONLY a valid JSON object in this exact structure. DO NOT wrap in markdown blocks, just raw JSON:\n" +
                "{\n" +
                "  \"sub_tasks\": [\n" +
                "    {\n" +
                "      \"temp_id\": \"New unique string like sub1, sub2\",\n" +
                "      \"requirement_code\": \"Inherit strictly from original\",\n" +
                "      \"use_case_code\": \"Inherit strictly from original\",\n" +
                "      \"title\": \"Clear action in English\",\n" +
                "      \"description\": \"Detailed scope in English\",\n" +
                "      \"checklists\": [\"Actionable step 1\"],\n" +
                "      \"estimated_hours\": 8.0,\n" +
                "      \"weight\": 1.0,\n" +
                "      \"task_type\": \"DEVELOPMENT | TESTING | DOCUMENTATION | UI_UX | RESEARCH | DEPLOYMENT | BUG_FIX | REVIEW\",\n" +
                "      \"priority\": \"LOW | MEDIUM | HIGH | CRITICAL (Inherit strictly from original)\",\n" +
                "      \"start_date\": \"YYYY-MM-DD\",\n" +
                "      \"suggested_deadline\": \"YYYY-MM-DD\",\n" +
                "      \"depends_on\": [\"Array of temp_id of OTHER sub-tasks\"],\n" +
                "      \"suggested_assignee\": {\n" +
                "        \"member_name\": \"Inherit strictly from original\",\n" +
                "        \"reason\": \"Why this person?\"\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}";
        return geminiService.generateText(prompt);
    }

    @Override
    public String mergeTasks(String tasksDataJson) {
        String prompt = "SYSTEM:\n" +
                "You are an expert Technical Project Manager. Your job is to merge multiple small tasks into one comprehensive task.\n\n" +
                "RULES:\n" +
                "- Combine scopes without losing details.\n" +
                "- Establish a logical title and description in English.\n" +
                "- Sum the estimated_hours of all original tasks.\n" +
                "- You MUST generate 3 to 5 'checklists' items as the combined Definition of Done. Consolidate criteria from the original tasks.\n" +
                "- NEVER generate past dates. start_date MUST BE >= today.\n" +
                "- suggested_deadline MUST BE >= start_date.\n" +
                "- CRITICAL BOUNDARY RULE: The start_date and suggested_deadline of the merged_task MUST fall strictly within the MIN(start_date) and MAX(suggested_deadline) of the original tasks provided below.\n" +
                "- The gap between start_date and suggested_deadline MUST strictly fit the estimated_hours (assume max 8h/day). E.g., a 40h task MUST have at least a 5-day gap! Try your best to calculate this.\n" +
                "- If all tasks belong to the same requirement/use_case, inherit it. Otherwise, set to null.\n" +
                "- If tasks share the same assignee, keep it. Otherwise, pick the most relevant one.\n" +
                "- Combine any external dependencies (depends_on) from the original tasks.\n" +
                "- If the tasks CANNOT be logically merged (e.g., completely unrelated), return null for merged_task AND provide a 'reason' string explaining why briefly.\n" +
                "- Return JSON only. No extra text.\n" +
                "- ALL text outputs MUST be strictly in English.\n\n" +
                "USER:\n" +
                "Tasks to merge:\n" +
                tasksDataJson + "\n\n" +
                "Return ONLY a valid JSON object of the merged task:\n" +
                "{\n" +
                "  \"merged_task\": {\n" +
                "    \"temp_id\": \"New unique string like merged1\",\n" +
                "    \"requirement_code\": \"Inherited or null\",\n" +
                "    \"use_case_code\": \"Inherited or null\",\n" +
                "    \"title\": \"Combined action in English\",\n" +
                "    \"description\": \"Combined detailed scope in English\",\n" +
                "    \"checklists\": [\"Actionable step 1\", \"Actionable step 2\", \"Actionable step 3\"],\n" +
                "    \"estimated_hours\": 16.0, // MUST BE A NUMBER ONLY, DO NOT ADD 'h'\n" +
                "    \"weight\": 1.0, // MUST BE A NUMBER ONLY\n" +
                "    \"task_type\": \"DEVELOPMENT | TESTING | DOCUMENTATION | UI_UX | RESEARCH | DEPLOYMENT | BUG_FIX | REVIEW\",\n" +
                "    \"priority\": \"Highest priority among merged tasks\",\n" +
                "    \"start_date\": \"YYYY-MM-DD\",\n" +
                "    \"suggested_deadline\": \"YYYY-MM-DD\",\n" +
                "    \"depends_on\": [\"Combined array of external dependencies\"],\n" +
                "    \"suggested_assignee\": {\n" +
                "      \"member_name\": \"Inherited or most relevant member\",\n" +
                "      \"reason\": \"Why this person?\"\n" +
                "    }\n" +
                "  },\n" +
                "  \"reason\": \"(Optional) Explain briefly why they cannot be merged if merged_task is null\"\n" +
                "}";
        return geminiService.generateText(prompt);
    }
}
