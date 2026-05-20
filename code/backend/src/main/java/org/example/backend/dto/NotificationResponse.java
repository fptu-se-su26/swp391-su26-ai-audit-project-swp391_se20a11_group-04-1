package org.example.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private String type; // INVITATION, SYSTEM
    private Long relatedId; // ID of ProjectInvitation if type is INVITATION
    private boolean isRead;
    private LocalDateTime createdAt;
    private String invitationStatus; // PENDING, ACCEPTED, REJECTED if type is INVITATION
}
