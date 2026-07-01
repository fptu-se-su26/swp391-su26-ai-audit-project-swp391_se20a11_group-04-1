package org.example.backend.dto.testing;

import lombok.Data;
import org.example.backend.entity.enums.TestType;
import java.util.List;

@Data
public class AiDraftTestCase {
    private String title;
    private TestType type;
    private String precondition;
    private String expectedResult;
    private String baseUrl;
    private Object stepsStructured;
    private List<TestStepRequest> steps;
    private String apiMethod;
    private String apiUrl;
    private Object apiHeaders;
    private Object apiQueryParams;
    private Object apiBody;
    private Object apiAssertions;
}
