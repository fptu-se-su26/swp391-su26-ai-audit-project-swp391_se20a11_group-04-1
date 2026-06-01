package org.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskReviewRequest {
    private String reason;
    private String targetStatus;
}
