package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightManualEvidenceLinkResponse {
    private Long id;
    private Long projectId;
    private Long taskId;
    private String evidenceType;
    private Long evidenceId;
    private String status;
    private String reason;
    private UserSummary suggestedBy;
    private UserSummary confirmedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }
}
