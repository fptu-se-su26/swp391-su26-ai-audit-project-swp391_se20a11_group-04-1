package org.example.backend.service.impl;

import org.example.backend.service.AiRoutingService;
import org.example.backend.service.UseCaseGeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UseCaseGeminiServiceImpl implements UseCaseGeminiService {

    private final AiRoutingService geminiService;

    @Autowired
    public UseCaseGeminiServiceImpl(AiRoutingService geminiService) {
        this.geminiService = geminiService;
    }

    @Override
    public String generateUseCasesFromRequirements(java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> projectActors, java.util.List<String> existingUseCases) {
        StringBuilder reqsContext = new StringBuilder();
        for (org.example.backend.entity.Requirement r : requirements) {
            reqsContext.append("Requirement ID: ").append(r.getId()).append("\n");
            reqsContext.append("Title: ").append(r.getTitle()).append("\n");
            reqsContext.append("Description: ").append(r.getDescription()).append("\n");
            reqsContext.append("Type: ").append(r.getType()).append("\n");
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

        String prompt = "You are an expert Business Analyst. I will provide you with one or more System Requirements.\n" +
                "Your task is to analyze these requirements and break them down into detailed Use Cases.\n" +
                "For EACH requirement, generate one or more Use Cases that fulfill it.\n\n" +
                "Your response MUST be a pure JSON array (without ```json wrappers). " +
                "Each object in the array represents ONE Use Case and must have EXACTLY these fields:\n" +
                "1. 'name': (String) A short, descriptive name (e.g., 'User Login').\n" +
                "2. 'primaryActors': (String) Comma separated actors. YOU MUST CHOOSE ONLY FROM THESE ALLOWED ACTORS: [" + actorsContext + "]. DO NOT invent new actors.\n" +
                "3. 'precondition': (String) What must be true before this use case begins.\n" +
                "4. 'postcondition': (String) What is the state of the system after this use case ends.\n" +
                "5. 'mainSuccessScenario': (String) The main success flow, 1 step per line. Number the steps like '1. ...\\n2. ...'\n" +
                "6. 'alternativeFlows': (String) Alternative or error flows. The number in 'AF[Number]' MUST BE THE EXACT STEP NUMBER from the main flow that it replaces or branches from. For example, if the flow branches from step 7, it MUST be named 'AF7:'. DO NOT name it 'AF1:' unless it branches from step 1. You MUST separate steps with NEWLINES ('\\n'). Example: 'AF7: If user saves as draft:\\n1. System saves privately.\\n2. User exits.' DO NOT write steps on a single line. DO NOT use markdown formatting like `**` or `*`.\n" +
                "7. 'requirementId': (Number) The EXACT ID of the Requirement this Use Case belongs to. You MUST copy the exact 'Requirement ID' number from the input. DO NOT make up a number.\n" +
                "8. 'includes': (Array of Strings) A list of existing Use Case names that this Use Case INCLUDES. \n" +
                "   - RULE: Include means this Use Case strictly REQUIRES the included Use Case to complete its main flow. \n" +
                "   - Identify included Use Cases by their names (e.g., Record, Log, Verify, Validate, Save, Authenticate). \n" +
                "   - Direction: This Use Case ---> Included Use Case. \n" +
                "   - Return [] if none. Do NOT guess. Limit to 1-2 most critical includes.\n" +
                "9. 'extendsList': (Array of Strings) A list of existing Use Case names that this Use Case EXTENDS. \n" +
                "   - RULE: Extend means this Use Case is an OPTIONAL/ALTERNATIVE extension to the base Use Case. \n" +
                "   - Identify extending Use Cases by their names (e.g., View Detail, View Results, Cancel, Edit, Export). \n" +
                "   - Direction: This Use Case (Extension) ---> Base Use Case. \n" +
                "   - Return [] if none. Do NOT guess. Limit to 1-2 most critical extends.\n\n" +
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
                "ABSOLUTELY RETURN ONLY THE JSON ARRAY. NO ADDITIONAL COMMENTS.\n\n" +
                "--- ALLOWED ACTORS ---\n" + actorsContext + "\n\n" +
                "--- EXISTING USE CASES ---\n" + existingUcsContext + "\n\n" +
                "--- PARENT REQUIREMENTS ---\n" + reqsContext.toString() + "\n\n" +
                "--- RAW USE CASES JSON ---\n" + rawUseCasesJson;

        return cleanJsonOutput(geminiService.generateText(prompt));
    }

    private String cleanJsonOutput(String response) {
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        response = response.trim();
        int firstBracket = response.indexOf("[");
        int lastBracket = response.lastIndexOf("]");
        if (firstBracket >= 0 && lastBracket >= 0 && lastBracket > firstBracket) {
            response = response.substring(firstBracket, lastBracket + 1);
        } else {
            firstBracket = response.indexOf("{");
            lastBracket = response.lastIndexOf("}");
            if (firstBracket >= 0 && lastBracket >= 0 && lastBracket > firstBracket) {
                response = response.substring(firstBracket, lastBracket + 1);
            }
        }
        return response;
    }
}
