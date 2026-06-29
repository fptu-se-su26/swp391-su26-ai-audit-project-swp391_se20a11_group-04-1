package org.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaViolationResponse {
    private Long taskId;
    private String taskTitle;
    private String status;
    private LocalDate deadline;
    private LocalDateTime updatedAt;
    private Long assigneeId;
    private String assigneeName;
    private String assigneeEmail;
    private long overdueDays;
    private boolean hasAcceptedEvidence;
    private boolean penaltyApplied;
    private List<String> categories;
    private String reason;
}
