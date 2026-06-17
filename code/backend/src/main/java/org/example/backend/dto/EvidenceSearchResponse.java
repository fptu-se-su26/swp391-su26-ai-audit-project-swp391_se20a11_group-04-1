package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceSearchResponse {
    private List<ResultItem> results;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResultItem {
        private Long id;
        private String evidenceType;
        private String title;
        private String subtitle;
        private String reference;
        private String url;
        private LocalDateTime occurredAt;
    }
}
