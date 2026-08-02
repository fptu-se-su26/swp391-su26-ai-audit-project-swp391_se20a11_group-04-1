package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class ActorGoal {
    private String goalId; // e.g. GOAL-001
    private String actorRef; // e.g. ACTOR-AI-001
    private String actorName; // human-readable name e.g. "Student", "Teacher"
    private String goal;
    private List<Long> requirementIds;
}
