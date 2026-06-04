package org.example.backend.service;

import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.Task;

public interface CodeInsightScoringService {
    TaskReviewDecisionResponse.ReviewEvidenceSummary buildReviewEvidenceSummary(Task task);
}
