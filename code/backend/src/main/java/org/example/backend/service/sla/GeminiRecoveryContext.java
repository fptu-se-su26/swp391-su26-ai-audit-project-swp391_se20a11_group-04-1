package org.example.backend.service.sla;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GeminiRecoveryContext {
    private String taskTitle;
    private String riskLevel;
    private List<String> categories;
    private List<String> reasons;
    private Integer slaScore;
    private long overdueDays;
    private long assigneeActiveTaskCount;
    private int previousPlanCount;
    private List<String> previousActions;
    private String previousEffectiveness;
    private Integer lastScoreBefore;
    private Integer lastScoreAfter;
    private boolean followUp;
}
