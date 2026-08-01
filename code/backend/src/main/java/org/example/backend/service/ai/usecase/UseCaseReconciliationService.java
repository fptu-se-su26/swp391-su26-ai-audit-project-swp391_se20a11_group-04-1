package org.example.backend.service.ai.usecase;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ai.GeneratedUseCaseDraft;
import org.example.backend.dto.ai.GeneratedUseCaseActorRef;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UseCaseReconciliationService {

    public List<GeneratedUseCaseDraft> reconcile(List<List<GeneratedUseCaseDraft>> allChunks) {
        List<GeneratedUseCaseDraft> merged = new ArrayList<>();
        for (List<GeneratedUseCaseDraft> chunk : allChunks) {
            if (chunk != null) {
                merged.addAll(chunk);
            }
        }

        // Re-assign unique temporary IDs across all chunks
        for (int i = 0; i < merged.size(); i++) {
            merged.get(i).setTemporaryId("AI-UC-" + String.format("%03d", i + 1));
        }

        // Detect semantic duplicates (same name, case insensitive)
        Set<String> seen = new HashSet<>();
        List<GeneratedUseCaseDraft> deduplicated = new ArrayList<>();
        for (GeneratedUseCaseDraft draft : merged) {
            String key = draft.getName() != null ? draft.getName().trim().toLowerCase() : "";
            if (seen.contains(key)) {
                log.warn("Semantic duplicate detected and removed: {}", draft.getName());
                continue;
            }
            seen.add(key);
            deduplicated.add(draft);
        }

        // Resolve include/extend targets: map temporary IDs to names
        Map<String, String> nameToTempId = deduplicated.stream()
                .filter(d -> d.getName() != null)
                .collect(Collectors.toMap(
                        d -> d.getName().trim().toLowerCase(),
                        GeneratedUseCaseDraft::getTemporaryId,
                        (a, b) -> a
                ));

        for (GeneratedUseCaseDraft draft : deduplicated) {
            // Resolve includes
            if (draft.getIncludes() != null) {
                List<String> resolved = draft.getIncludes().stream()
                        .map(ref -> {
                            // If it's already a temp ID, validate it exists
                            if (ref.startsWith("AI-UC-")) return ref;
                            // Try to find by name
                            String id = nameToTempId.get(ref.trim().toLowerCase());
                            return id != null ? id : ref;
                        })
                        .filter(ref -> !ref.equals(draft.getTemporaryId())) // Remove self-include
                        .collect(Collectors.toList());
                draft.setIncludes(resolved);
            }

            // Resolve extends
            if (draft.getExtendsList() != null) {
                List<String> resolved = draft.getExtendsList().stream()
                        .map(ref -> {
                            if (ref.startsWith("AI-UC-")) return ref;
                            String id = nameToTempId.get(ref.trim().toLowerCase());
                            return id != null ? id : ref;
                        })
                        .filter(ref -> !ref.equals(draft.getTemporaryId())) // Remove self-extend
                        .collect(Collectors.toList());
                draft.setExtendsList(resolved);
            }

            // Ensure every UC has at least one actor with PRIMARY role
            if (draft.getActors() == null || draft.getActors().isEmpty()) {
                GeneratedUseCaseActorRef defaultActor = new GeneratedUseCaseActorRef();
                defaultActor.setActorRef("UNKNOWN");
                defaultActor.setRole("PRIMARY");
                draft.setActors(List.of(defaultActor));
            } else {
                boolean hasPrimary = draft.getActors().stream()
                        .anyMatch(a -> "PRIMARY".equalsIgnoreCase(a.getRole()));
                if (!hasPrimary) {
                    draft.getActors().get(0).setRole("PRIMARY");
                }
            }
        }

        return deduplicated;
    }
}
