package org.example.backend.service.impl;

import org.example.backend.service.AiRoutingService;
import org.example.backend.service.UseCaseGeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Service
public class UseCaseGeminiServiceImpl implements UseCaseGeminiService {

    private final AiRoutingService geminiService;

    @Autowired
    public UseCaseGeminiServiceImpl(AiRoutingService geminiService) {
        this.geminiService = geminiService;
    }

    @Override
    public String generateUseCasesFromRequirements(java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> projectActors, java.util.List<String> existingUseCases, org.example.backend.entity.Project project, java.util.List<String> projectMembersUsernames) {
        StringBuilder reqsContext = new StringBuilder();
        for (org.example.backend.entity.Requirement r : requirements) {
            reqsContext.append("Requirement ID: ").append(r.getId()).append("\n");
            reqsContext.append("Title: ").append(r.getTitle()).append("\n");
            reqsContext.append("Description: ").append(r.getDescription()).append("\n");
            reqsContext.append("Type: ").append(r.getType()).append("\n");
            reqsContext.append("Start Date: ").append(r.getStartDate()).append("\n");
            reqsContext.append("Deadline: ").append(r.getDeadline()).append("\n");
            if (r.getType() != null) {
                switch (r.getType()) {
                    case FUNCTIONAL:
                        reqsContext.append("Instruction: This is a Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses. Extract Primary Actors and step-by-step flows.\n");
                        break;
                    case NON_FUNCTIONAL:
                        reqsContext.append("Instruction: This is a Non-Functional Requirement. If a Use Case cannot be meaningfully created, skip this requirement entirely and return an empty array for it. Do not force the creation of user-action Use Cases.\n");
                        break;
                    case BUSINESS_RULE:
                        reqsContext.append("Instruction: This is a Business Rule. Generate exactly one Use Case named 'Validate [Rule Name]' with alternate flows detailing when the rule is violated. Do not generate standard functional flows.\n");
                        break;
                    case SECURITY:
                        reqsContext.append("Instruction: This is a Security Requirement. Focus on threat prevention, access control, and data protection. The primary actor for Security Use Cases MUST be 'System' or 'Admin', NOT regular users.\n");
                        break;
                    default:
                        reqsContext.append("Instruction: Treat this as a standard Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses.\n");
                        break;
                }
            } else {
                reqsContext.append("Instruction: Treat this as a standard Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses.\n");
            }
            reqsContext.append("Acceptance Criteria: ").append(r.getAcceptanceCriteria()).append("\n");
            reqsContext.append("---\n");
        }

        String actorsContext = projectActors != null && !projectActors.isEmpty() 
                ? String.join(", ", projectActors) 
                : "(No pre-defined actors. Use standard generic actors)";
        
        String existingUcContext = existingUseCases != null && !existingUseCases.isEmpty()
                ? String.join("\n- ", existingUseCases)
                : "(No existing use cases)";
                
        String projectMembersContext = "(No members available)";
        if (projectMembersUsernames != null && !projectMembersUsernames.isEmpty()) {
            projectMembersContext = String.join(", ", projectMembersUsernames);
        }

        String prompt = "You are a Senior Business Analyst and Software Architect. I will provide you with one or more System Requirements.\n" +
                "Your task is to analyze these requirements and break them down into detailed Use Cases.\n" +
                "CRITICAL BUSINESS RULE: You MUST be proactive. Do NOT just blindly copy what is written in the requirement. " +
                "If a requirement implies a broader business module (e.g., 'Account Management' or 'Authentication'), you MUST deduce and generate ALL standard use cases required to make that module logically complete in a real-world system.\n" +
                "For EACH requirement, generate one or more Use Cases that fulfill it and complete its business ecosystem.\n\n" +
                "Your response MUST be a pure JSON array (without ```json wrappers). " +
                "Each object in the array represents ONE Use Case and must have EXACTLY these fields:\n" +
                "1. 'moduleName': (String) [MANDATORY] The overarching Business Module this Use Case belongs to (e.g., 'Authentication', 'Order Management', 'Inventory'). You MUST group use cases logically based on standard business processes. Group similar requirements into the same module to create a cohesive system architecture. DO NOT use generic names like 'General Module'. Avoid creating too many small, fragmented modules.\n" +
                "2. 'moduleDescription': (String) [MANDATORY] A short description of the Business Module.\n" +
                "3. 'modulePriority': (String) [MANDATORY] The priority of this module. MUST be exactly one of: 'HIGH', 'MEDIUM', 'LOW'.\n" +
                "4. 'moduleAssignee': (String) [MANDATORY] The username of the member who will be responsible for developing this module. Choose ONLY from these allowed project members: [" + projectMembersContext + "]. Distribute work evenly across members. If no suitable member is found or list is empty, return 'System'.\n" +
                "5. 'name': (String) A short, descriptive name (e.g., 'User Login').\n" +
                "6. 'primaryActors': (String) Comma separated actors. YOU MUST CHOOSE ONLY FROM THESE ALLOWED ACTORS: [" + actorsContext + "]. DO NOT invent new actors.\n" +
                "7. 'precondition': (String) Strict technical state required before execution (e.g., 'User must be authenticated and have ADMIN role'). DO NOT write vague conditions.\n" +
                "8. 'postcondition': (String) Strict final state of the database or system (e.g., 'A new Order record is committed to the database with status PENDING').\n" +
                "9. 'mainSuccessScenario': (String) The main success flow, 1 step per line. MUST include explicit system logic (e.g., 'System validates token, calculates total, and saves to DB'). Number the steps like '1. ...\\n2. ...'\n" +
                "10. 'alternativeFlows': (String) Alternative or error flows. The number in 'AF[Number]' MUST BE THE EXACT STEP NUMBER from the main flow that it replaces or branches from. For example, if the flow branches from step 7, it MUST be named 'AF7:'. DO NOT name it 'AF1:' unless it branches from step 1. You MUST separate steps with NEWLINES ('\\n'). Example: 'AF7: If user saves as draft:\\n1. System saves privately.\\n2. User exits.' DO NOT write steps on a single line. DO NOT use markdown formatting like `**` or `*`.\n" +
                "11. 'requirementIds': (Array of Numbers) The exact IDs of the Requirements this Use Case belongs to. You MUST copy the exact 'Requirement ID' numbers from the input as raw numbers (e.g. [182]). DO NOT output strings or prefixes like 'Req #'.\n" +
                "12. 'includes': (Array of Strings) A list of existing Use Case names that this Use Case INCLUDES. \n" +
                "   - RULE: Include means this Use Case strictly REQUIRES the included Use Case to complete its main flow. \n" +
                "   - Identify included Use Cases by their names (e.g., Record, Log, Verify, Validate, Save, Authenticate). \n" +
                "   - Direction: This Use Case ---> Included Use Case. \n" +
                "   - Return [] if none. Do NOT guess. Limit to 1-2 most critical includes.\n" +
                "13. 'extendsList': (Array of Strings) A list of existing Use Case names that this Use Case EXTENDS. \n" +
                "   - RULE: Extend means this Use Case is an OPTIONAL/ALTERNATIVE extension to the base Use Case. \n" +
                "   - Identify extending Use Cases by their names (e.g., View Detail, View Results, Cancel, Edit, Export). \n" +
                "   - Direction: This Use Case (Extension) ---> Base Use Case. \n" +
                "   - Return [] if none. Do NOT guess. Limit to 1-2 most critical extends.\n" +
                "14. 'startDate': (String) Generate a logical start date for this use case in YYYY-MM-DD format. The date MUST NOT be before TODAY's date: " + LocalDate.now().toString() + ". DO NOT generate a date in the past. It should also be on or after the parent requirement's start date.\n" +
                "15. 'deadline': (String) Generate a logical deadline for this use case in YYYY-MM-DD format. The date MUST NOT be after the requirement's deadline, and MUST NOT be after the project's deadline: " + (project != null && project.getDeadline() != null ? project.getDeadline().toString() : "N/A") + ". It must also be after the startDate.\n\n" +
                "=== MANDATORY COMPLETENESS RULES (HIGHEST PRIORITY) ===\n" +
                "You MUST think like a professional Senior BA writing full production-grade specs. Do NOT generate only 1-2 UCs per requirement. " +
                "For EACH business module, generate the COMPLETE, EXHAUSTIVE set of Use Cases. Follow ALL rules below:\n\n" +
                "RULE A - FULL CRUD COVERAGE: For EVERY entity in a module (User, Product, Order, Report, Category, etc.) you MUST generate ALL applicable operations:\n" +
                "  * CREATE: 'Create [Entity]', 'Register [Entity]', 'Add [Entity]'\n" +
                "  * READ LIST: 'View [Entity] List', 'Search [Entity]', 'Browse [Entity]', 'Filter [Entity]'\n" +
                "  * READ DETAIL: 'View [Entity] Detail', 'View [Entity] Profile', 'View [Entity] History'\n" +
                "  * UPDATE: 'Update [Entity]', 'Edit [Entity] Information', 'Modify [Entity]'\n" +
                "  * DELETE/DEACTIVATE: 'Delete [Entity]', 'Remove [Entity]', 'Deactivate [Entity]'\n" +
                "  * STATUS TRANSITIONS: 'Approve [Entity]', 'Reject [Entity]', 'Publish [Entity]', 'Archive [Entity]', 'Cancel [Entity]'\n" +
                "  * EXPORT/IMPORT: 'Export [Entity] Data', 'Import [Entity] Data' (if applicable)\n\n" +
                "RULE B - AUTHENTICATION MODULE: If ANY requirement mentions user accounts, login, or security, you MUST generate ALL of these:\n" +
                "  Register, Login, Logout, Forgot Password, Reset Password, Change Password, View My Profile, Update My Profile, Upload Avatar, Verify Email.\n\n" +
                "RULE C - ADMIN PANEL: If an Admin actor exists, generate dedicated Admin management UCs for every core entity:\n" +
                "  'Manage [Entity]s', 'View [Entity] Analytics', 'Generate [Entity] Report', 'Configure [Module] Settings', 'View Audit Log'.\n\n" +
                "RULE D - SEARCH & FILTER: Every list view MUST have a corresponding 'Search and Filter [Entity]' UC.\n\n" +
                "RULE E - NOTIFICATIONS: For any user action that changes state, add: 'Receive Notification', 'View Notification List', 'Mark Notification as Read'.\n\n" +
                "RULE F - ROLE-SPECIFIC VIEWS: If multiple actors exist, generate separate UCs for each role's view (e.g., 'View My Orders' for User, 'View All Orders' for Admin, 'View Assigned Orders' for Staff).\n\n" +
                "RULE G - DASHBOARD: Every role should have a 'View [Role] Dashboard' UC that aggregates key information.\n\n" +
                "MINIMUM VOLUME EXPECTATION:\n" +
                "- A small/simple module: MINIMUM 5 Use Cases\n" +
                "- A medium module (User Management, Order Management): MINIMUM 10-15 Use Cases\n" +
                "- A large/complex module (Inventory, Reporting, Scheduling): MINIMUM 15-20 Use Cases\n" +
                "A module with fewer Use Cases than the minimum is considered INCOMPLETE and UNACCEPTABLE.\n\n" +
                "STRICT UML BUSINESS RULES:\n" +
                "- An isolated Use Case (no actors) CANNOT include or extend other isolated Use Cases. At least one must be connected to an actor.\n" +
                "- Use Cases that represent system sub-routines (e.g., Record, Log, Verify) should generally NOT have an actor connected directly to them, and should only be 'included' by other Use Cases.\n" +
                "- DO NOT connect actors to sub-routine Use Cases. DO NOT add include/extend relations if not completely obvious. Prefer a clean diagram over a messy one.\n\n" +
                "CRITICAL INSTRUCTION: All generated text (except keys) MUST BE WRITTEN IN ENGLISH, to match the target audience.\n" +
                "YOU MUST RETURN ONLY A DIRECT JSON ARRAY. DO NOT WRAP IT IN A JSON OBJECT.\n\n" +
                "--- ALLOWED ACTORS ---\n" + actorsContext + "\n\n" +
                "--- EXISTING USE CASES ---\n" + existingUcContext + "\n\n" +
                "--- SYSTEM REQUIREMENTS ---\n" + reqsContext.toString();
        
        return cleanJsonOutput(geminiService.generateText(prompt));
    }

    @Override
    public String evaluateUseCasesWithCritic(String rawUseCasesJson, java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> existingUseCases, java.util.List<String> allowedActors) {
        StringBuilder reqsContext = new StringBuilder();
        if (requirements != null) {
            for (org.example.backend.entity.Requirement r : requirements) {
                reqsContext.append("Requirement ID: ").append(r.getId()).append("\n");
                reqsContext.append("Title: ").append(r.getTitle()).append("\n");
                reqsContext.append("Description: ").append(r.getDescription()).append("\n");
                reqsContext.append("---\n");
            }
        }

        String existingUcsContext = existingUseCases != null && !existingUseCases.isEmpty()
                ? String.join("\n- ", existingUseCases)
                : "(No existing use cases)";

        String actorsContext = allowedActors != null && !allowedActors.isEmpty()
                ? String.join(", ", allowedActors)
                : "(No pre-defined actors. Allow any.)";

        String prompt = "You are an extremely strict Senior QA / Business Analyst (AI Critic). " +
                "I will provide you with a list of recently generated Use Cases (in JSON format), " +
                "their original parent Requirements, the list of EXISTING USE CASES in the project, and ALLOWED ACTORS.\n\n" +
                "Your task: Read each Use Case and evaluate its quality. " +
                "Return the EXACT SAME JSON array, but append 4 evaluation fields to EACH object:\n" +
                "1. 'quality_status': (String) Quality status, must be strictly one of: 'OK', 'Warning', 'Error'.\n" +
                "2. 'warnings': (Array of Strings) List in ENGLISH any ambiguities, lack of details, or ACTOR VIOLATIONS (if they use an actor NOT in the ALLOWED ACTORS list, you MUST flag a warning).\n" +
                "3. 'errors': (Array of Strings) List in ENGLISH any logical errors, disconnected alternative flows, contradictions, or SCOPE CREEP / COMPLETENESS ISSUES (e.g., Use Case has actions totally unrelated to the Parent Requirement, or postcondition fails to achieve the goal).\n" +
                "4. 'isDuplicate': (Boolean) Set to true IF AND ONLY IF this newly generated Use Case is a SEMANTIC DUPLICATE or functionally identical to any Use Case in the EXISTING USE CASES list. Otherwise, false.\n\n" +
                "CRITICAL RULE: YOU MUST PRESERVE ALL ORIGINAL FIELDS from the input JSON (especially 'startDate', 'deadline', 'includes', 'extendsList'). DO NOT REMOVE ANY EXISTING FIELD.\n\n" +
                "ABSOLUTELY RETURN ONLY THE JSON ARRAY. NO ADDITIONAL COMMENTS.\n\n" +
                "--- ALLOWED ACTORS ---\n" + actorsContext + "\n\n" +
                "--- EXISTING USE CASES ---\n" + existingUcsContext + "\n\n" +
                "--- PARENT REQUIREMENTS ---\n" + reqsContext.toString() + "\n\n" +
                "--- RAW USE CASES JSON ---\n" + rawUseCasesJson;

        return cleanJsonOutput(geminiService.generateText(prompt));
    }

    private String cleanJsonOutput(String response) {
        if (response == null) return "";
        
        int codeBlockStart = response.indexOf("```json");
        if (codeBlockStart != -1) {
            int codeBlockEnd = response.lastIndexOf("```");
            if (codeBlockEnd > codeBlockStart) {
                response = response.substring(codeBlockStart + 7, codeBlockEnd);
            }
        } else {
            codeBlockStart = response.indexOf("```");
            if (codeBlockStart != -1) {
                int codeBlockEnd = response.lastIndexOf("```");
                if (codeBlockEnd > codeBlockStart && codeBlockStart != codeBlockEnd) {
                    response = response.substring(codeBlockStart + 3, codeBlockEnd);
                    if (response.trim().startsWith("json")) {
                        response = response.trim().substring(4);
                    }
                }
            }
        }
        
        response = response.trim();
        int firstCurly = response.indexOf("{");
        int lastCurly = response.lastIndexOf("}");
        int firstSquare = response.indexOf("[");
        int lastSquare = response.lastIndexOf("]");
        
        if (firstCurly != -1 && lastCurly > firstCurly) {
            if (firstSquare != -1 && lastSquare > firstSquare) {
                if (firstCurly < firstSquare && lastCurly > lastSquare) {
                    return response.substring(firstCurly, lastCurly + 1);
                } else if (firstSquare < firstCurly && lastSquare > lastCurly) {
                    return response.substring(firstSquare, lastSquare + 1);
                } else {
                    if (firstCurly < firstSquare) return response.substring(firstCurly, lastCurly + 1);
                    else return response.substring(firstSquare, lastSquare + 1);
                }
            } else {
                return response.substring(firstCurly, lastCurly + 1);
            }
        } else if (firstSquare != -1 && lastSquare > firstSquare) {
            return response.substring(firstSquare, lastSquare + 1);
        }
        return response;
    }
}
