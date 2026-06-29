package org.example.backend.dto.testing;

import lombok.Data;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.entity.enums.TestType;

import java.time.LocalDateTime;

@Data
public class TestCaseListItemResponse {
    private Long id;
    private String code;
    private String title;
    private String requirementCode;
    private TestType type;
    private TestCaseStatus status;
    private String lastExecutedBy;
    private LocalDateTime lastExecutedAt;
}
