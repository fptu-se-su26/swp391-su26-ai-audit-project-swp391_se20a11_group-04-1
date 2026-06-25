package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "processed_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessedEvent {

    @Id
    @Column(name = "idempotency_key", length = 64)
    private String idempotencyKey;

    @Column(name = "consumer_id", length = 100)
    private String consumerId;

    @Column(name = "processed_at", updatable = false)
    @Builder.Default
    private LocalDateTime processedAt = LocalDateTime.now();
}
