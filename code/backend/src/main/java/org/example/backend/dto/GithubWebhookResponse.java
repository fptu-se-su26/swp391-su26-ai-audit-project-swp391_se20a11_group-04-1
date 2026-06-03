package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GithubWebhookResponse {
    // Minimal response returned immediately to GitHub after storing or deduplicating a delivery.
    private Long eventId;
    private String deliveryId;
    private String eventType;
    private String status;
    private boolean duplicate;
    private LocalDateTime receivedAt;
}
