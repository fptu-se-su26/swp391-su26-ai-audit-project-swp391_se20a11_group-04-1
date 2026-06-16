package org.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.testing.TestCaseRequest;
import org.example.backend.entity.enums.TestType;
import org.example.backend.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiApiTestGeneratorService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AiApiTestGeneratorService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public TestCaseRequest generateFromDescription(String description) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("Gemini API key is not configured.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

        String prompt = "You are an API Testing expert. I will give you a description of an API requirement or curl command. " +
                "Generate an API test case including method, url, headers, body, and a list of assertions. " +
                "Only return valid JSON matching this structure exactly (NO markdown code blocks, NO extra text):\n" +
                "{\n" +
                "  \"title\": \"Test name\",\n" +
                "  \"precondition\": \"Description\",\n" +
                "  \"apiMethod\": \"GET/POST/PUT/DELETE\",\n" +
                "  \"apiUrl\": \"http://example.com/api/v1/resource\",\n" +
                "  \"apiHeaders\": { \"Content-Type\": \"application/json\" },\n" +
                "  \"apiQueryParams\": {},\n" +
                "  \"apiBody\": {},\n" +
                "  \"apiAssertions\": [\n" +
                "    { \"type\": \"STATUS_CODE\", \"operator\": \"EQUALS\", \"expectedValue\": \"200\" },\n" +
                "    { \"type\": \"JSON_PATH\", \"property\": \"$.data.id\", \"operator\": \"EXISTS\" }\n" +
                "  ]\n" +
                "}\n\n" +
                "Description:\n" + description;

        Map<String, Object> payload = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", List.of(part));
        payload.put("contents", List.of(content));

        // Bắt buộc output là JSON
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        payload.put("generationConfig", generationConfig);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, httpHeaders);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map<String, Object> bodyMap = response.getBody();
            if (bodyMap != null && bodyMap.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) bodyMap.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> contentMap = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                    if (!parts.isEmpty()) {
                        String rawJson = (String) parts.get(0).get("text");
                        String cleanJson = rawJson.trim();
                        if (cleanJson.startsWith("```json")) {
                            cleanJson = cleanJson.substring(7);
                        }
                        if (cleanJson.endsWith("```")) {
                            cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
                        }
                        cleanJson = cleanJson.trim();
                        TestCaseRequest request = objectMapper.readValue(cleanJson, TestCaseRequest.class);
                        request.setType(TestType.API);
                        return request;
                    }
                }
            }
            throw new BusinessException("Empty response from AI.");
        } catch (Exception e) {
            log.error("Failed to parse result from AI: ", e);
            throw new BusinessException("Không thể parse kết quả từ AI, vui lòng thử lại! Lỗi: " + e.getMessage());
        }
    }
}
