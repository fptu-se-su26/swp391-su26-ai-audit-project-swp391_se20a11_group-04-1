package org.example.backend.service.ai.usecase;

import org.example.backend.dto.ai.ActorDiscoveryResult;
import org.example.backend.dto.ai.ActorGoal;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UseCasePlanningService {

    private static final int MAX_GOALS_PER_CHUNK = 5;

    public List<List<ActorGoal>> chunkGoalsForGeneration(ActorDiscoveryResult discoveryResult) {
        List<List<ActorGoal>> chunks = new ArrayList<>();
        List<ActorGoal> currentChunk = new ArrayList<>();
        
        for (ActorGoal goal : discoveryResult.getActorGoalMatrix()) {
            currentChunk.add(goal);
            if (currentChunk.size() >= MAX_GOALS_PER_CHUNK) {
                chunks.add(currentChunk);
                currentChunk = new ArrayList<>();
            }
        }
        if (!currentChunk.isEmpty()) {
            chunks.add(currentChunk);
        }
        
        return chunks;
    }
}
