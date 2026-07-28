package org.example.backend.dto.testing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.example.backend.entity.enums.TestType;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiDraftTestCase {
    private String title;
    private Long requirementId;
    private TestType type;
    private String precondition;
    private String expectedResult;
    private Object configuration;
    private List<TestStepRequest> steps;
    private List<String> coveredAcceptanceCriteria = new ArrayList<>();
    private List<String> coveredUseCases = new ArrayList<>();
    private String scenarioType;
    private List<String> sourceGrounding = new ArrayList<>();
    private String validationStatus = "UNVALIDATED";
    private List<String> validationMessages = new ArrayList<>();
}
