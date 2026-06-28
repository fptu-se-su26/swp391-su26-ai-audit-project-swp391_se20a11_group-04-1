package org.example.backend.dto;
import lombok.Builder;
import lombok.Data;
import org.example.backend.entity.DeadLetterEvent;
import java.time.LocalDateTime;

@Data
@Builder
public class DeadLetterEventResponse {
    private Long id;
    private Long originalEventId;
    private String eventType;
    private String aggregateId;
    private String failureReason;
    private int retryCount;
    private LocalDateTime lastRetryAt;
    private String retryStatus;
    private LocalDateTime createdAt;

    public static DeadLetterEventResponse fromEntity(DeadLetterEvent event) {
        return DeadLetterEventResponse.builder()
                .id(event.getId())
                .originalEventId(event.getOriginalEventId())
                .eventType(event.getEventType())
                .aggregateId(event.getAggregateId())
                .failureReason(event.getFailureReason())
                .retryCount(event.getRetryCount())
                .lastRetryAt(event.getLastRetryAt())
                .retryStatus(event.getRetryStatus())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
