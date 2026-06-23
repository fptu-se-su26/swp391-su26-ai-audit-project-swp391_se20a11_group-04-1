package org.example.backend.dto;

import lombok.Data;

@Data
public class AgentTaskResultSubmitDTO {
    private String outcome;
    private String notes;
    private Long durationMs;
    private Integer failedStepIndex;
    private Object steps;   // Dùng Object thay JsonNode để tránh conflict Jackson 2.x vs 3.x
    private java.util.List<String> evidenceUrls;

    private java.util.Map<String, Object> extraProperties = new java.util.HashMap<>();

    @com.fasterxml.jackson.annotation.JsonAnySetter
    public void setExtraProperty(String key, Object value) {
        // "status" field xử lý đặc biệt: Playwright agent gửi "PASS"/"FAIL" (string),
        // API test agent gửi HTTP status code (number như 200, 404).
        // Chỉ intercept khi value là string PASS/PASSED/FAIL/FAILED.
        // Các giá trị khác (số, string khác) giữ nguyên trong extraProperties
        // để ApiTestExecutorService đọc được HTTP status code.
        if ("status".equals(key) && value != null) {
            String s = value.toString();
            if ("PASS".equalsIgnoreCase(s) || "PASSED".equalsIgnoreCase(s)) {
                if (this.outcome == null) this.outcome = "PASSED";
            } else if ("FAIL".equalsIgnoreCase(s) || "FAILED".equalsIgnoreCase(s)) {
                if (this.outcome == null) this.outcome = "FAILED";
            }
            // Luôn giữ lại "status" gốc trong extraProperties để API test có thể đọc
            extraProperties.put(key, value);
        } else if ("duration".equals(key) && value instanceof Number) {
            if (this.durationMs == null) this.durationMs = ((Number) value).longValue();
            extraProperties.put(key, value); // giữ lại cho API test
        } else if ("error".equals(key) && value != null) {
            if (this.notes == null) {
                if (value instanceof java.util.Map) {
                    Object msg = ((java.util.Map<?,?>) value).get("message");
                    if (msg != null) this.notes = msg.toString();
                } else if (value instanceof String && !((String) value).isEmpty()) {
                    this.notes = value.toString();
                }
            }
            extraProperties.put(key, value); // giữ lại cho API test
        } else {
            extraProperties.put(key, value);
        }
    }

    @com.fasterxml.jackson.annotation.JsonAnyGetter
    public java.util.Map<String, Object> getExtraProperties() {
        return extraProperties;
    }
}
