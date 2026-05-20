package org.example.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class EvidenceResponse {
    private Long id;
    private Long projectId;
    private Long uploadedById;
    private String uploadedByName;
    private String type;
    private String title;
    private String description;
    private String fileUrl;
    private String externalUrl;
    private Map<String, Object> metadata;
    private String status;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private List<EvidenceLinkDto> evidenceLinks;
}
