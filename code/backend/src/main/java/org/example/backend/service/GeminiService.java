package org.example.backend.service;

public interface GeminiService {
    String generateText(String prompt);
    String extractRequirementsFromText(String documentText);
    String generateUseCasesFromRequirements(java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> projectActors, java.util.List<String> existingUseCases);
    String evaluateRequirementsWithCritic(String rawRequirementsJson, String documentText, java.util.List<String> existingRequirements);
    String evaluateDocumentContext(java.util.List<String> existingRequirementContexts, String documentText);
    String evaluateUseCasesWithCritic(String rawUseCasesJson, java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> existingUseCases, java.util.List<String> allowedActors);
}
