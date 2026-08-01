package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class ActorDiscoveryResult {
    private List<DiscoveredActor> existingActorsUsed;
    private List<DiscoveredActor> proposedActors;
    private List<ActorGoal> actorGoalMatrix;
}
