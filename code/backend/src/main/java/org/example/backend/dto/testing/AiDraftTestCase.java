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
    private Object configuration;
    private List<TestStepRequest> steps;
}
