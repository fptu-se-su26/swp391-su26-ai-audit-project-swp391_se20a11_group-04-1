package org.example.backend.service.sla;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiRecoveryMemberCandidate {
    private Long userId;
    private String displayName;
    private String roleName;
    private long activeTaskCount;
    private long overdueTaskCount;
    private boolean currentAssignee;
}
