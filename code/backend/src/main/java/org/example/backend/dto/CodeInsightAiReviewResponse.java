package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightAiReviewResponse {
    private Long id;
    private String provider;
    private String recommendation;
    private int confidence;
    private String summary;
    private List<String> risks;
    private List<String> reviewQuestions;
    private int scoreAdjustment;
    private LocalDateTime createdAt;
}
