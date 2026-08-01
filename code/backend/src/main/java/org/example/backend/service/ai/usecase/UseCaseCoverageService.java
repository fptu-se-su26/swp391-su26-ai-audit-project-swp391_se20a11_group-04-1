package org.example.backend.service.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ai.*;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.RequirementType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UseCaseCoverageService {

    private final ObjectMapper objectMapper;

    @Autowired
    public UseCaseCoverageService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public UseCaseCoverageReport calculateCoverage(UseCaseGenerationContext context,
                                                   ActorDiscoveryResult discovery,
                                                   List<GeneratedUseCaseDraft> useCases) {
        UseCaseCoverageReport report = new UseCaseCoverageReport();

        // 1. Requirement Coverage: functional requirements linked to at least 1 UC
        List<Requirement> functionalReqs = context.getModuleRequirements().stream()
                .filter(r -> r.getType() == RequirementType.FUNCTIONAL)
                .collect(Collectors.toList());

        Set<Long> coveredReqIds = useCases.stream()
                .filter(uc -> uc.getRequirementIds() != null)
                .flatMap(uc -> uc.getRequirementIds().stream())
                .collect(Collectors.toSet());

        long totalFunctionalReqs = functionalReqs.size();
        long coveredFunctionalReqs = functionalReqs.stream()
                .filter(r -> coveredReqIds.contains(r.getId()))
                .count();

        report.setRequirementCoveragePercent(
                totalFunctionalReqs > 0 ? (double) coveredFunctionalReqs / totalFunctionalReqs * 100.0 : 100.0
        );

        List<Long> uncoveredReqIds = functionalReqs.stream()
                .filter(r -> !coveredReqIds.contains(r.getId()))
                .map(Requirement::getId)
                .collect(Collectors.toList());
        report.setUncoveredRequirementIds(uncoveredReqIds);

        // 2. AC Coverage
        int totalAcCount = 0;
        int coveredAcCount = 0;
        List<String> uncoveredAcs = new ArrayList<>();

        Set<String> coveredAcKeys = new HashSet<>();
        for (GeneratedUseCaseDraft uc : useCases) {
            if (uc.getAcceptanceCriteriaCoverage() != null) {
                for (GeneratedUseCaseDraft.AcceptanceCriteriaRef ref : uc.getAcceptanceCriteriaCoverage()) {
                    coveredAcKeys.add(ref.getRequirementId() + ":" + ref.getCriterionIndex());
                }
            }
        }

        for (Requirement r : functionalReqs) {
            int acCount = countAcceptanceCriteria(r.getAcceptanceCriteria());
            totalAcCount += acCount;
            for (int i = 0; i < acCount; i++) {
                String key = r.getId() + ":" + i;
                if (coveredAcKeys.contains(key)) {
                    coveredAcCount++;
                } else {
                    uncoveredAcs.add("REQ-" + r.getId() + " AC#" + (i + 1));
                }
            }
        }

        report.setAcceptanceCriteriaCoveragePercent(
                totalAcCount > 0 ? (double) coveredAcCount / totalAcCount * 100.0 : 100.0
        );
        report.setUncoveredAcceptanceCriteria(uncoveredAcs);

        // 3. Actor-Goal Coverage
        if (discovery != null && discovery.getActorGoalMatrix() != null) {
            Set<String> coveredGoalIds = useCases.stream()
                    .filter(uc -> uc.getGoalIds() != null)
                    .flatMap(uc -> uc.getGoalIds().stream())
                    .collect(Collectors.toSet());

            int totalGoals = discovery.getActorGoalMatrix().size();
            long coveredGoals = discovery.getActorGoalMatrix().stream()
                    .filter(g -> coveredGoalIds.contains(g.getGoalId()))
                    .count();

            report.setActorGoalCoveragePercent(
                    totalGoals > 0 ? (double) coveredGoals / totalGoals * 100.0 : 100.0
            );

            report.setUncoveredGoalIds(
                    discovery.getActorGoalMatrix().stream()
                            .filter(g -> !coveredGoalIds.contains(g.getGoalId()))
                            .map(ActorGoal::getGoalId)
                            .collect(Collectors.toList())
            );
        } else {
            report.setActorGoalCoveragePercent(100.0);
            report.setUncoveredGoalIds(new ArrayList<>());
        }

        // 4. Orphan detection
        Set<String> usedActorRefs = useCases.stream()
                .filter(uc -> uc.getActors() != null)
                .flatMap(uc -> uc.getActors().stream())
                .map(GeneratedUseCaseActorRef::getActorRef)
                .collect(Collectors.toSet());

        report.setUseCasesWithNoActor(
                useCases.stream()
                        .filter(uc -> uc.getActors() == null || uc.getActors().isEmpty())
                        .map(GeneratedUseCaseDraft::getTemporaryId)
                        .collect(Collectors.toList())
        );

        Set<String> allActorRefs = new HashSet<>();
        if (discovery != null) {
            if (discovery.getExistingActorsUsed() != null) {
                discovery.getExistingActorsUsed().forEach(a -> allActorRefs.add(a.getTemporaryId()));
            }
            if (discovery.getProposedActors() != null) {
                discovery.getProposedActors().forEach(a -> allActorRefs.add(a.getTemporaryId()));
            }
        }
        report.setActorsWithNoUseCase(
                allActorRefs.stream()
                        .filter(ref -> !usedActorRefs.contains(ref))
                        .collect(Collectors.toList())
        );

        return report;
    }

    private int countAcceptanceCriteria(String acceptanceCriteriaJson) {
        if (acceptanceCriteriaJson == null || acceptanceCriteriaJson.isBlank() || "[]".equals(acceptanceCriteriaJson.trim())) {
            return 0;
        }
        try {
            JsonNode node = objectMapper.readTree(acceptanceCriteriaJson);
            return node.isArray() ? node.size() : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
