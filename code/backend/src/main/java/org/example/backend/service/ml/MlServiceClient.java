package org.example.backend.service.ml;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Slf4j
@Service
public class MlServiceClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final boolean enabled;

    public MlServiceClient(
            @Value("${ml.service.url:http://localhost:8001}") String baseUrl,
            @Value("${ml.service.enabled:true}") boolean enabled,
            @Value("${ml.service.timeout-ms:2000}") int timeoutMs) {

        this.baseUrl = baseUrl;
        this.enabled = enabled;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Call /predict/sla-risk. Returns empty if ML service is down or disabled.
     * Never throws — always falls back gracefully.
     */
    public Optional<MlSlaRiskResponse> predictSlaRisk(MlSlaRiskRequest request) {
        if (!enabled) {
            return Optional.empty();
        }
        try {
            MlSlaRiskResponse response = restTemplate.postForObject(
                    baseUrl + "/predict/sla-risk",
                    request,
                    MlSlaRiskResponse.class);
            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("ML service unavailable (sla-risk): {}", ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Send RLHF feedback to /feedback endpoint. Fire-and-forget, ignores failures.
     */
    public void sendFeedback(long taskId, String predictionType,
                             String predictedValue, boolean isCorrect) {
        if (!enabled) return;
        try {
            var body = java.util.Map.of(
                    "task_id", taskId,
                    "prediction_type", predictionType,
                    "predicted_value", predictedValue,
                    "is_correct", isCorrect);
            restTemplate.postForObject(baseUrl + "/feedback", body, Object.class);
        } catch (Exception ex) {
            log.debug("Failed to send ML feedback: {}", ex.getMessage());
        }
    }
}
