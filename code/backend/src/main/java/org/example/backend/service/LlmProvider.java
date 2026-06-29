package org.example.backend.service;

public interface LlmProvider {
    /**
     * Tên của nhà cung cấp (VD: GEMINI, GROQ, OPENROUTER)
     */
    String getProviderName();

    /**
     * Sinh text từ prompt. Phương thức này tự chịu trách nhiệm handle quota, retry xoay vòng key.
     */
    String generateText(String prompt);
}
