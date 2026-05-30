package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchedulerEmailResponse {
    private Long id;
    private String recipientName;
    private String recipientEmail;
    private String subject;
    private String status;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
}
