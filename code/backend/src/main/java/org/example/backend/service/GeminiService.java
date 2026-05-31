package org.example.backend.service;

public interface GeminiService {
    String generateText(String prompt);
    String extractRequirementsFromText(String documentText);
    String evaluateRequirementsWithCritic(String rawRequirementsJson, String documentText);
}
