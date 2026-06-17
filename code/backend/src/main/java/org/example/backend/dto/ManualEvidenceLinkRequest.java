package org.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ManualEvidenceLinkRequest {
    private String evidenceType;
    private Long evidenceId;
    private String reason;
}
