package org.example.backend.dto.ai;

import lombok.Data;

@Data
public class GeneratedUseCaseActorRef {
    private String actorRef;
    private String role; // e.g. "PRIMARY", "SECONDARY"
}
