package org.example.backend.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
public class CodeInsightAiProviderException extends RuntimeException {
    private final String provider;
    private final String model;
    private final String errorType;
    private final String providerStatus;
    private final int providerStatusCode;
    private final boolean retryable;
    private final Integer retryAfterSeconds;
    private final String detail;
    private final HttpStatus httpStatus;

    public CodeInsightAiProviderException(
            String message,
            String provider,
            String model,
            String errorType,
            String providerStatus,
            int providerStatusCode,
            boolean retryable,
            Integer retryAfterSeconds,
            String detail,
            HttpStatus httpStatus) {
        super(message);
        this.provider = provider;
        this.model = model;
        this.errorType = errorType;
        this.providerStatus = providerStatus;
        this.providerStatusCode = providerStatusCode;
        this.retryable = retryable;
        this.retryAfterSeconds = retryAfterSeconds;
        this.detail = detail;
        this.httpStatus = httpStatus;
    }

    public Map<String, Object> toErrorBody() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("provider", provider);
        body.put("model", model);
        body.put("errorType", errorType);
        body.put("providerStatus", providerStatus);
        body.put("providerStatusCode", providerStatusCode);
        body.put("retryable", retryable);
        body.put("retryAfterSeconds", retryAfterSeconds);
        body.put("detail", detail);
        return body;
    }
}
