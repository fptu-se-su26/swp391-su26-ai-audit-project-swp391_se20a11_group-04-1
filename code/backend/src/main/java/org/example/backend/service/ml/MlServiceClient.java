package org.example.backend.service.ml;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.ml.enabled", havingValue = "true")
public class MlServiceClient {

    private final RestTemplate restTemplate;
    private final String serviceUrl;

    public MlServiceClient(
            @Value("${app.ml.service-url:http://localhost:8000}") String serviceUrl,
            @Value("${app.ml.timeout-ms:2000}") int timeoutMs) {
        this.serviceUrl = trimTrailingSlash(serviceUrl);

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);
    }

    public Optional<MlSlaRiskResponse> predictSlaRisk(MlSlaRiskRequest request) {
        try {
            MlSlaRiskResponse response = restTemplate.postForObject(
                    serviceUrl + "/predict/sla-risk",
                    request,
                    MlSlaRiskResponse.class);
            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("ML SLA risk prediction unavailable, falling back to rule-based result: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:8000";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
