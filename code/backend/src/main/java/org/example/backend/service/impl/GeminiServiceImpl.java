package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.example.backend.config.GeminiProperties;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GeminiServiceImpl implements GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiProperties geminiProperties;

    @Autowired
    public GeminiServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper, GeminiProperties geminiProperties) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.geminiProperties = geminiProperties;
    }

    @Override
    public String generateText(String prompt) {
        return callGeminiApi(prompt);
    }

    @Override
    public String extractRequirementsFromText(String documentText) {
        String prompt = "Dưới đây là nội dung văn bản được trích xuất từ một tài liệu yêu cầu dự án. " +
                "Nhiệm vụ của bạn là phân tích và trích xuất danh sách các Yêu cầu (Requirements) từ văn bản này. " +
                "Phản hồi của bạn PHẢI là một mảng JSON thuần túy (không bọc trong ```json), " +
                "mỗi object đại diện cho một Requirement với các trường sau: " +
                "1. 'title': (String) Tiêu đề ngắn gọn của yêu cầu. " +
                "2. 'description': (String) Mô tả chi tiết. " +
                "3. 'priority': (String) Một trong các giá trị 'Low', 'Medium', 'High'. " +
                "4. 'tags': (Array of Strings) Danh sách các thẻ phân loại (vd: ['Frontend', 'UI']). " +
                "5. 'acceptanceCriteria': (Array of Strings) Tự động suy luận và tạo ra số lượng tiêu chí nghiệm thu phù hợp với từng yêu cầu (không cố định số lượng). Các tiêu chí cần rõ ràng, thực tế và có thể kiểm thử được. " +
                "Tuyệt đối không giải thích thêm, chỉ trả về JSON.\n\n" +
                "Nội dung văn bản:\n" + documentText;
        
        String response = callGeminiApi(prompt);
        // Clean up formatting if Gemini returns ```json ... ```
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        return response.trim();
    }

    @Override
    public String evaluateRequirementsWithCritic(String rawRequirementsJson, String documentText) {
        String prompt = "Bạn là một Senior QA / Business Analyst cực kỳ khắt khe (AI Critic). " +
                "Tôi sẽ cung cấp cho bạn một danh sách các Yêu cầu (Requirements) vừa được trích xuất (dạng JSON) " +
                "và Nội dung tài liệu gốc.\n\n" +
                "Nhiệm vụ của bạn: Đọc từng Yêu cầu, đối chiếu với tài liệu gốc để ĐÁNH GIÁ CHẤT LƯỢNG của nó. " +
                "Hãy trả về đúng mảng JSON đó nhưng bổ sung thêm 4 trường đánh giá cho MỖI object:\n" +
                "1. 'quality_status': (String) Trạng thái chất lượng, chỉ được chọn 1 trong 3: 'OK', 'Warning', 'Error'.\n" +
                "2. 'warnings': (Array of Strings) Liệt kê các điểm mơ hồ, thiếu chi tiết (nếu có, không có thì để mảng rỗng).\n" +
                "3. 'errors': (Array of Strings) Liệt kê lỗi sai lệch nội dung, mâu thuẫn (nếu có, không có thì rỗng).\n" +
                "4. 'source_excerpt': (String) Trích dẫn một câu nguyên bản từ tài liệu gốc chứng minh cho Yêu cầu này.\n\n" +
                "TUYỆT ĐỐI CHỈ TRẢ VỀ MẢNG JSON, KHÔNG BÌNH LUẬN GÌ THÊM.\n\n" +
                "--- DANH SÁCH REQUIREMENTS THÔ ---\n" + rawRequirementsJson + "\n\n" +
                "--- TÀI LIỆU GỐC ---\n" + documentText;

        String response = callGeminiApi(prompt);
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        return response.trim();
    }

    private String callGeminiApi(String prompt) {
        String apiKey = geminiProperties.getKey();
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            throw new RuntimeException("API Key của Gemini chưa được cấu hình. Vui lòng thêm vào application.yaml.");
        }

        String targetUrl = geminiProperties.getUrl();
        if (targetUrl == null || targetUrl.isEmpty()) {
            throw new RuntimeException("Chưa cấu hình URL (gemini.api.url) trong application.yaml");
        }
        
        String requestUrl = targetUrl + "?key=" + apiKey;

        // Build the request body for Gemini API
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", prompt);

        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", List.of(parts));

        requestBody.put("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            // Send POST request
            String jsonResponse = restTemplate.postForObject(requestUrl, entity, String.class);
            
            // Parse the JSON response
            JsonNode rootNode = objectMapper.readTree(jsonResponse);
            JsonNode textNode = rootNode.path("candidates")
                                        .get(0)
                                        .path("content")
                                        .path("parts")
                                        .get(0)
                                        .path("text");
            
            if (textNode.isMissingNode()) {
                throw new RuntimeException("Không tìm thấy kết quả hợp lệ từ Gemini.");
            }
            
            return textNode.asText();
        } catch (HttpStatusCodeException httpException) {
            int statusCode = httpException.getStatusCode().value();
            log.error("Gemini API HTTP Error {}: {}", statusCode, httpException.getResponseBodyAsString());
            if (statusCode == 429) {
                throw new RuntimeException("Gemini API Quota Exceeded (429). Please use a new API Key.");
            } else if (statusCode == 404) {
                throw new RuntimeException("Gemini Model not found or API Key lacks access (404 Not Found).");
            } else if (statusCode == 400) {
                throw new RuntimeException("Bad Request payload sent to Gemini (400 Bad Request).");
            }
            throw new RuntimeException("Gemini API Error (Code: " + statusCode + ")");
        } catch (Exception e) {
            log.error("Unknown error when calling Gemini API: {}", e.getMessage(), e);
            throw new RuntimeException("Unknown error when calling Gemini API. Please try again.");
        }
    }
}
