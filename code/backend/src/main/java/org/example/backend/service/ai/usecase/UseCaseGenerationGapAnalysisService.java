package org.example.backend.service.ai.usecase;

import org.example.backend.dto.ai.ModuleCoverageReport;
import org.example.backend.dto.ai.UseCaseCoverageReport;
import org.example.backend.dto.ai.UseCaseGenerationPayload;
import org.example.backend.dto.ai.GeneratedModuleDraft;
import org.example.backend.dto.ai.GeneratedUseCaseDraft;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.UseCase;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UseCaseGenerationGapAnalysisService {

    public List<Requirement> filterRequirementsForGeneration(List<Requirement> selectedRequirements, 
                                                             List<UseCase> existingUseCases, 
                                                             boolean regenerateMissingOnly) {
        if (!regenerateMissingOnly || existingUseCases == null || existingUseCases.isEmpty()) {
            return new ArrayList<>(selectedRequirements);
        }

        // Find all requirement IDs that already have at least one UseCase
        Set<Long> coveredRequirementIds = new HashSet<>();
        for (UseCase uc : existingUseCases) {
            if (uc.getRequirements() != null) {
                for (Requirement r : uc.getRequirements()) {
                    coveredRequirementIds.add(r.getId());
                }
            }
        }

        // Filter out those requirements
        return selectedRequirements.stream()
                .filter(r -> !coveredRequirementIds.contains(r.getId()))
                .collect(Collectors.toList());
    }

    public UseCaseCoverageReport generateGlobalCoverageReport(UseCaseGenerationPayload payload, List<Requirement> allInputRequirements) {
        UseCaseCoverageReport report = new UseCaseCoverageReport();
        
        Set<Long> allReqIds = allInputRequirements.stream().map(Requirement::getId).collect(Collectors.toSet());
        Set<Long> coveredReqIds = new HashSet<>();

        if (payload.getUseCases() != null) {
            for (GeneratedUseCaseDraft uc : payload.getUseCases()) {
                if (uc.getRequirementIds() != null) {
                    coveredReqIds.addAll(uc.getRequirementIds());
                }
            }
        }

        Set<Long> uncovered = new HashSet<>(allReqIds);
        uncovered.removeAll(coveredReqIds);

        report.setUncoveredRequirementIds(new ArrayList<>(uncovered));
        if (!allReqIds.isEmpty()) {
            report.setRequirementCoveragePercent(((double) coveredReqIds.size() / allReqIds.size()) * 100.0);
        } else {
            report.setRequirementCoveragePercent(100.0);
        }

        return report;
    }

    public List<ModuleCoverageReport> generateModuleCoverageReports(UseCaseGenerationPayload payload, List<Requirement> allInputRequirements) {
        List<ModuleCoverageReport> reports = new ArrayList<>();
        if (payload.getModules() == null || payload.getUseCases() == null) {
            return reports;
        }

        for (GeneratedModuleDraft module : payload.getModules()) {
            ModuleCoverageReport mcr = new ModuleCoverageReport();
            mcr.setModuleRef(module.getTemporaryId());
            
            Set<Long> expectedReqs = new HashSet<>();
            if (module.getRequirementIds() != null) {
                expectedReqs.addAll(module.getRequirementIds());
            }
            
            Set<Long> coveredReqs = new HashSet<>();
            for (GeneratedUseCaseDraft uc : payload.getUseCases()) {
                if (module.getTemporaryId().equals(uc.getModuleRef()) && uc.getRequirementIds() != null) {
                    coveredReqs.addAll(uc.getRequirementIds());
                }
            }
            
            Set<Long> uncovered = new HashSet<>(expectedReqs);
            uncovered.removeAll(coveredReqs);
            
            mcr.setUncoveredRequirementIds(new ArrayList<>(uncovered));
            if (!expectedReqs.isEmpty()) {
                mcr.setRequirementCoveragePercent(((double) coveredReqs.size() / expectedReqs.size()) * 100.0);
            } else {
                mcr.setRequirementCoveragePercent(100.0);
            }
            
            reports.add(mcr);
        }

        return reports;
    }
}
