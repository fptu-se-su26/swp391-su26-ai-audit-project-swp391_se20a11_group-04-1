package org.example.backend.dto.testing;

import lombok.Data;
import java.util.List;

@Data
public class AiTestCaseGenerateResponse {
    private String reasoning;
    private String coverageSummary;
    private List<TestCaseRequest> testCases;
}
