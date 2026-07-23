package org.example.backend.service;

public interface RequirementGeminiService {
    String extractRequirementsFromText(String documentText, org.example.backend.entity.Project project);
    String evaluateRequirementsWithCritic(String rawRequirementsJson, String documentText, java.util.List<String> existingRequirements);
    String evaluateDocumentContext(java.util.List<String> existingRequirementContexts, String documentText);
}
