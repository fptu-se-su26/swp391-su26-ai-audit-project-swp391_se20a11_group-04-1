package org.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskReviewRequest {
    // Optional note from requester/leader; required when rejecting a task review.
    private String reason;

    // Used only for rejection to decide where the task returns after leader feedback.
    private String targetStatus;
}
