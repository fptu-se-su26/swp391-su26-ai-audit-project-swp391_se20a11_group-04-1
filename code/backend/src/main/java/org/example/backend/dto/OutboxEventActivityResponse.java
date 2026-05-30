package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEventActivityResponse {
    private Long id;
    private String eventType;
    private String status;
    private String recipientName;
    private String recipientEmail;
    private String actionLabel;
    private String message;
    private String targetLabel;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
}
