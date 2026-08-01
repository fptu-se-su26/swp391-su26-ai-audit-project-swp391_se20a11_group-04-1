package org.example.backend.service.ai.usecase;

import org.example.backend.dto.ai.*;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.text.Normalizer;
import java.util.*;

@Service
public class ActorReferenceMergeService {

    public void mergeAndRemap(UseCaseGenerationPayload payload) {
        if (payload == null) return;

        Map<String, String> oldRefToCanonicalRef = new HashMap<>();
        Map<String, DiscoveredActor> canonicalProposedActors = new LinkedHashMap<>();
        Map<String, DiscoveredActor> canonicalExistingActors = new LinkedHashMap<>();

        // 1. Process Existing Actors
        if (payload.getExistingActorsUsed() != null) {
            for (DiscoveredActor existing : payload.getExistingActorsUsed()) {
                if (existing.getExistingActorId() == null) continue;
                String canonicalRef = "ACTOR-EXIST-" + existing.getExistingActorId();
                if (existing.getTemporaryId() != null) {
                    oldRefToCanonicalRef.put(existing.getTemporaryId(), canonicalRef);
                }
                existing.setTemporaryId(canonicalRef);
                canonicalExistingActors.put(canonicalRef, existing);
            }
            payload.setExistingActorsUsed(new ArrayList<>(canonicalExistingActors.values()));
        }

        // 2. Process Proposed Actors (Merge by normalized name)
        if (payload.getProposedActors() != null) {
            for (DiscoveredActor proposed : payload.getProposedActors()) {
                String normalizedName = normalizeActorName(proposed.getName());
                if (normalizedName.isEmpty()) continue;
                
                String shortHash = DigestUtils.md5DigestAsHex(normalizedName.getBytes()).substring(0, 8).toUpperCase();
                String canonicalRef = "ACTOR-AI-" + shortHash;
                
                if (proposed.getTemporaryId() != null) {
                    oldRefToCanonicalRef.put(proposed.getTemporaryId(), canonicalRef);
                }
                
                if (!canonicalProposedActors.containsKey(canonicalRef)) {
                    proposed.setTemporaryId(canonicalRef);
                    canonicalProposedActors.put(canonicalRef, proposed);
                } else {
                    // Merge evidence requirements
                    DiscoveredActor canonical = canonicalProposedActors.get(canonicalRef);
                    if (proposed.getEvidenceRequirementIds() != null) {
                        Set<Long> mergedReqs = new HashSet<>();
                        if (canonical.getEvidenceRequirementIds() != null) {
                            mergedReqs.addAll(canonical.getEvidenceRequirementIds());
                        }
                        mergedReqs.addAll(proposed.getEvidenceRequirementIds());
                        canonical.setEvidenceRequirementIds(new ArrayList<>(mergedReqs));
                    }
                }
            }
            payload.setProposedActors(new ArrayList<>(canonicalProposedActors.values()));
        }

        // 3. Remap all nested structures
        if (payload.getActorGoalMatrix() != null) {
            for (ActorGoal goal : payload.getActorGoalMatrix()) {
                if (goal.getActorRef() != null && oldRefToCanonicalRef.containsKey(goal.getActorRef())) {
                    goal.setActorRef(oldRefToCanonicalRef.get(goal.getActorRef()));
                }
            }
        }

        if (payload.getUseCases() != null) {
            for (GeneratedUseCaseDraft uc : payload.getUseCases()) {
                if (uc.getActors() != null) {
                    for (GeneratedUseCaseActorRef aRef : uc.getActors()) {
                        if (aRef.getActorRef() != null && oldRefToCanonicalRef.containsKey(aRef.getActorRef())) {
                            aRef.setActorRef(oldRefToCanonicalRef.get(aRef.getActorRef()));
                        }
                    }
                }
                
                if (uc.getMainFlow() != null && uc.getMainFlow().getSteps() != null) {
                    for (StructuredMainFlow.MainStep step : uc.getMainFlow().getSteps()) {
                        if (step.getActorRef() != null && oldRefToCanonicalRef.containsKey(step.getActorRef())) {
                            step.setActorRef(oldRefToCanonicalRef.get(step.getActorRef()));
                        }
                    }
                }
                
                if (uc.getAlternativeFlows() != null && uc.getAlternativeFlows().getFlows() != null) {
                    for (StructuredAlternativeFlow.AltFlow altFlow : uc.getAlternativeFlows().getFlows()) {
                        if (altFlow.getSteps() != null) {
                            for (StructuredAlternativeFlow.AltStep step : altFlow.getSteps()) {
                                if (step.getActorRef() != null && oldRefToCanonicalRef.containsKey(step.getActorRef())) {
                                    step.setActorRef(oldRefToCanonicalRef.get(step.getActorRef()));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private String normalizeActorName(String name) {
        if (name == null) return "";
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFKC);
        return normalized.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }
}
