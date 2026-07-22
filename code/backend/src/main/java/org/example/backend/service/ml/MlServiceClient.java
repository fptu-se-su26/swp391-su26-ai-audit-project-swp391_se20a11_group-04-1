package org.example.backend.service.ml;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import org.example.backend.service.sla.AiRecoveryContext;
import org.example.backend.service.sla.AiRecoveryResult;
@Slf4j
@Service
public class MlServiceClient {

    private final RestTemplate restTemplate;
    private final RestTemplate longPollingRestTemplate;
    private final String baseUrl;
    private final boolean enabled;

    public MlServiceClient(
            @Value("${ml.service.url:http://localhost:8001}") String baseUrl,
            @Value("${ml.service.enabled:true}") boolean enabled,
            @Value("${ml.service.timeout-ms:2000}") int timeoutMs,
            @Value("${ml.service.recovery-timeout-ms:300000}") int recoveryTimeoutMs) {

        this.baseUrl = baseUrl;
        this.enabled = enabled;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);

        SimpleClientHttpRequestFactory longFactory = new SimpleClientHttpRequestFactory();
        longFactory.setConnectTimeout(timeoutMs); // Connect is fast
        longFactory.setReadTimeout(recoveryTimeoutMs); // LLM generation is slow
        this.longPollingRestTemplate = new RestTemplate(longFactory);
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

    /**
     * Send RLHF recovery plan signal to /feedback/signal.
     * signal: APPROVE / REJECT / GATE_RESULT
     * Fire-and-forget — never throws, never blocks main flow.
     */
    public void sendRecoverySignal(Long planId, String signal,
                                   Integer scoreBefore, Integer scoreAfter,
                                   String riskLevel, java.util.List<String> categories,
                                   String summary, String rejectReason) {
        if (!enabled) return;
        try {
            var body = new java.util.LinkedHashMap<String, Object>();
            body.put("plan_id",       planId);
            body.put("signal",        signal);
            if ("GATE_RESULT".equals(signal)) {
                boolean passed = scoreAfter != null && scoreBefore != null
                        && scoreAfter > scoreBefore;
                body.put("gate_result",  passed ? "PASSED" : "FAILED");
            }
            body.put("score_before",  scoreBefore);
            body.put("score_after",   scoreAfter);
            body.put("reject_reason", rejectReason);
            body.put("risk_level",    riskLevel);
            body.put("categories",    categories != null ? categories : java.util.List.of());
            body.put("summary",       summary);
            restTemplate.postForObject(baseUrl + "/feedback/signal", body, Object.class);
        } catch (Exception ex) {
            log.debug("Failed to send recovery signal to ML service (non-critical): {}",
                    ex.getMessage());
        }
    }

    /**
     * Generate AI Recovery Plan via Python ML Service Gateway.
     * Handles RAG and LLM calling internally.
     * Returns null if service is down, LLM fails, or disabled to trigger graceful fallback.
     */
    public AiRecoveryResult generateRecoveryPlan(AiRecoveryContext context) {
        if (!enabled) {
            return null;
        }
        try {
            return longPollingRestTemplate.postForObject(
                    baseUrl + "/recovery/generate-plan",
                    context,
                    AiRecoveryResult.class);
        } catch (Exception ex) {
            log.error("Failed to generate AI recovery plan via ML Service Gateway (falling back to rules): {}", ex.getMessage());
            return null;
        }
    }
}
