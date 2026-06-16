package org.example.backend.dto.apitest;

import lombok.Data;
import org.example.backend.entity.enums.ApiTestStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class ApiTestResultResponse {
    private Long id;
    private Long testCaseId;
    private Long environmentId;
    private Long executedBy;
    private ApiTestStatus status;
    private Integer statusCode;
    private Integer responseTimeMs;
    private Map<String, String> responseHeaders;
    private String responseBody;
    private List<AssertionResultDto> assertionResults;
    private String errorMessage;
    private String executedVia;
    private LocalDateTime executedAt;
    private boolean isSaved;
}
