package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "github_webhook_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id")
    private GitHubIntegration integration;

    @Column(name = "delivery_id", nullable = false, unique = true, length = 120)
    private String deliveryId;

    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;

    @Column(length = 255)
    private String signature;

    @Column(name = "payload_hash", nullable = false, length = 64)
    private String payloadHash;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_json", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "processed_status", nullable = false, length = 30)
    @Builder.Default
    private GitHubWebhookEventStatus processedStatus = GitHubWebhookEventStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "received_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime receivedAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
