package org.example.backend.service;

public interface UseCaseGeminiService {
    String generateUseCasesFromRequirements(java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> projectActors, java.util.List<String> existingUseCases, org.example.backend.entity.Project project, java.util.List<String> projectMembersUsernames, java.util.List<String> existingModuleNames);
    String evaluateUseCasesWithCritic(String rawUseCasesJson, java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> existingUseCases, java.util.List<String> allowedActors);
}
