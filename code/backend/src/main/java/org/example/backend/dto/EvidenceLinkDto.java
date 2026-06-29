package org.example.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EvidenceLinkDto {
    private Long id;
    private Long evidenceId;
    private String entityType;
    private Long entityId;
    private LocalDateTime linkedAt;
}
