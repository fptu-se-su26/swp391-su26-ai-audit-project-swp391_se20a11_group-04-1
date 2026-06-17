package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightApprovalGateResponse;
import org.example.backend.dto.GateCheck;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.BadRequestException;
import org.example.backend.repository.*;
import org.example.backend.service.CodeInsightApprovalGateService;
import org.example.backend.service.CodeInsightScoringService;
import org.example.backend.service.EvidenceConfidenceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CodeInsightApprovalGateServiceImpl implements CodeInsightApprovalGateService {

    private final CodeInsightScoringService scoringService;
    private final ProjectCodeInsightSettingsRepository settingsRepository;
    private final CodeInsightEvidenceLinkRepository codeInsightEvidenceLinkRepository;
    private final ManualEvidenceLinkRepository manualEvidenceLinkRepository;
    private final CodeInsightAiReviewRepository aiReviewRepository;
    private final EvidenceLinkRepository generalEvidenceLinkRepository;
    private final EvidenceConfidenceService confidenceService;

    @Override
    @Transactional(readOnly = true)
    public CodeInsightApprovalGateResponse evaluate(Task task) {
        if (task == null) {
            throw new BadRequestException("Task cannot be null");
        }

        // 1. Get Evidence Summary (score stats) from scoring service
        TaskReviewDecisionResponse.ReviewEvidenceSummary score = scoringService.buildReviewEvidenceSummary(task);

        // 2. Fetch project settings
        ProjectCodeInsightSettings settings = task.getProject() != null
                ? settingsRepository.findByProjectId(task.getProject().getId()).orElse(defaultSettings())
                : defaultSettings();

        // 3. Fetch latest AI Review risk level
        CodeInsightAiReview aiReview = aiReviewRepository.findTopByTaskIdOrderByCreatedAtDesc(task.getId()).orElse(null);
        String codeRiskLevel = aiReview != null ? aiReview.getCodeRiskLevel() : "LOW";

        // 4. Calculate Evidence Confidence
        EvidenceConfidenceLevel evidenceConfidence = confidenceService.calculate(task);

        // 5. Fetch general evidence links
        List<EvidenceLink> generalLinks = task.getId() != null
                ? generalEvidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, task.getId())
                : Collections.emptyList();
        List<Evidence> generalEvidences = generalLinks.stream()
                .map(EvidenceLink::getEvidence)
                .filter(Objects::nonNull)
                .toList();

        // 6. Evaluate Checklist based on Task Type
        List<GateCheck> gateChecks = new ArrayList<>();
        List<String> blockers = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        TaskType type = task.getType();
        if (type == TaskType.DEVELOPMENT || type == TaskType.BUG_FIX) {
            evaluateCodeChecklist(task, score, settings, gateChecks, blockers, warnings);
        } else if (type == TaskType.DEPLOYMENT) {
            evaluateDeploymentChecklist(generalEvidences, score, gateChecks, blockers, warnings);
        } else if (type == TaskType.DOCUMENTATION) {
            evaluateDocumentationChecklist(generalEvidences, gateChecks, blockers, warnings);
        } else if (type == TaskType.UI_UX) {
            evaluateUiUxChecklist(generalEvidences, gateChecks, blockers, warnings);
        } else if (type == TaskType.TESTING) {
            evaluateTestingChecklist(generalEvidences, gateChecks, blockers, warnings);
        } else {
            evaluateGenericChecklist(generalEvidences, score, gateChecks, blockers, warnings);
        }

        // Check for general pending manual evidence
        if (hasPendingManualEvidence(task)) {
            warnings.add("Manual evidence is pending leader confirmation.");
        }

        // Determine gate approval status
        String approvalStatus = !blockers.isEmpty()
                ? "BLOCKED"
                : !warnings.isEmpty() ? "CAN_APPROVE_WITH_WARNING" : "CAN_APPROVE";

        return CodeInsightApprovalGateResponse.builder()
                .approvalStatus(approvalStatus)
                .riskLevel(score.getRiskLevel()) // backward-compatible
                .score(score.getScore())         // backward-compatible
                .blockers(blockers)
                .warnings(warnings)
                .evidenceConfidence(evidenceConfidence.name())
                .codeRiskLevel(codeRiskLevel)
                .gateChecks(gateChecks)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public void assertCanApprove(Task task) {
        CodeInsightApprovalGateResponse gate = evaluate(task);
        if ("BLOCKED".equals(gate.getApprovalStatus())) {
            throw new BadRequestException("Cannot approve task: " + String.join(" ", gate.getBlockers()));
        }
    }

    private void evaluateCodeChecklist(
            Task task,
            TaskReviewDecisionResponse.ReviewEvidenceSummary score,
            ProjectCodeInsightSettings settings,
            List<GateCheck> gateChecks,
            List<String> blockers,
            List<String> warnings) {

        // PR_LINKED
        boolean hasPr = score.getPullRequestCount() > 0;
        gateChecks.add(GateCheck.builder()
                .name("PR_LINKED")
                .status(hasPr ? "PASS" : "FAIL")
                .detail(hasPr ? "Pull request linked." : "Missing linked pull request.")
                .build());
        if (!hasPr) {
            blockers.add("A pull request is required before approval.");
        }

        // COMMIT_EXIST
        boolean hasCommit = score.getCommitCount() > 0;
        gateChecks.add(GateCheck.builder()
                .name("COMMIT_EXIST")
                .status(hasCommit ? "PASS" : "FAIL")
                .detail(hasCommit ? "Linked commit found." : "No linked commit evidence.")
                .build());
        if (!hasCommit) {
            blockers.add("Commit evidence is required.");
        }

        // CI_PIPELINE_PASSED
        String ciStatus = score.getCiStatus();
        boolean ciPassed = "PASSED".equals(ciStatus);
        gateChecks.add(GateCheck.builder()
                .name("CI_PIPELINE_PASSED")
                .status(ciPassed ? "PASS" : "FAIL")
                .detail(ciPassed ? "CI check passed." : "CI check status is: " + ciStatus)
                .build());
        if (!ciPassed) {
            if ("FAILED".equals(ciStatus)) {
                blockers.add("Linked CI/check evidence failed.");
            } else if ("PENDING".equals(ciStatus)) {
                blockers.add("Linked CI/check evidence is still pending.");
            } else { // NO_CI
                blockers.add("No CI/check evidence is linked.");
            }
        }

        // PR_MERGEABLE
        boolean hasDraft = score.getWarnings() != null && score.getWarnings().stream()
                .anyMatch(w -> w.contains("still draft"));
        boolean prMergeable = !hasDraft;
        gateChecks.add(GateCheck.builder()
                .name("PR_MERGEABLE")
                .status(prMergeable ? "PASS" : "WARNING")
                .detail(prMergeable ? "Pull request is ready to merge." : "Linked pull request is still draft.")
                .build());
        if (!prMergeable) {
            warnings.add("Linked pull request is still draft.");
        }

        // PEER_APPROVED
        boolean peerApproved = score.isHasMergedPullRequest();
        gateChecks.add(GateCheck.builder()
                .name("PEER_APPROVED")
                .status(peerApproved ? "PASS" : "WARNING")
                .detail(peerApproved ? "Pull request is merged." : "Linked pull request is not merged.")
                .build());
        if (!peerApproved) {
            warnings.add("Linked pull request is not merged.");
        }

        // AUTHOR_MATCH
        boolean authorMatch = score.getPositiveSignals().contains("GitHub author matches assignee");
        gateChecks.add(GateCheck.builder()
                .name("AUTHOR_MATCH")
                .status(authorMatch ? "PASS" : "WARNING")
                .detail(authorMatch ? "GitHub author matches assignee." : "GitHub author does not match assignee.")
                .build());
        if (!authorMatch) {
            warnings.add("GitHub author does not match assignee.");
        }

        // Extra compatibility settings checks
        if (settings.isRequirePrForDone() && !hasPr) {
            if (!blockers.contains("A pull request is required before approval.")) {
                blockers.add("A pull request is required before approval.");
            }
        }
        if (settings.isRequireCiPass() && "NO_CI".equals(ciStatus)) {
            warnings.add("CI pass is preferred, but no CI/check evidence exists for this task.");
        }
    }

    private void evaluateDeploymentChecklist(
            List<Evidence> evidences,
            TaskReviewDecisionResponse.ReviewEvidenceSummary score,
            List<GateCheck> gateChecks,
            List<String> blockers,
            List<String> warnings) {

        // DEPLOY_LOG_OR_PIPELINE
        boolean hasDeployLog = score.getCheckRunCount() > 0 || evidences.stream()
                .anyMatch(e -> e.getType() == EvidenceType.DEPLOY_LINK 
                        || e.getType() == EvidenceType.DOCUMENT 
                        || e.getType() == EvidenceType.SCREENSHOT 
                        || e.getType() == EvidenceType.SCREEN_RECORDING);
        gateChecks.add(GateCheck.builder()
                .name("DEPLOY_LOG_OR_PIPELINE")
                .status(hasDeployLog ? "PASS" : "FAIL")
                .detail(hasDeployLog ? "Deploy log or pipeline run found." : "Missing deploy log or pipeline verification.")
                .build());
        if (!hasDeployLog) {
            blockers.add("Deploy log or pipeline evidence is required.");
        }

        // RELEASE_NOTE_PROVIDED
        boolean hasReleaseNote = evidences.stream()
                .anyMatch(e -> e.getType() == EvidenceType.DOCUMENT);
        gateChecks.add(GateCheck.builder()
                .name("RELEASE_NOTE_PROVIDED")
                .status(hasReleaseNote ? "PASS" : "FAIL")
                .detail(hasReleaseNote ? "Release notes doc provided." : "No release notes document linked.")
                .build());
        if (!hasReleaseNote) {
            blockers.add("Release notes document is required.");
        }

        // LIVE_URL_PROVIDED
        boolean hasLiveUrl = evidences.stream()
                .anyMatch(e -> e.getType() == EvidenceType.DEPLOY_LINK 
                        || (e.getExternalUrl() != null && !e.getExternalUrl().trim().isEmpty()));
        gateChecks.add(GateCheck.builder()
                .name("LIVE_URL_PROVIDED")
                .status(hasLiveUrl ? "PASS" : "WARNING")
                .detail(hasLiveUrl ? "Live deployment URL found." : "No live deployment URL linked.")
                .build());
        if (!hasLiveUrl) {
            warnings.add("Live URL is not provided.");
        }
    }

    private void evaluateDocumentationChecklist(
            List<Evidence> evidences,
            List<GateCheck> gateChecks,
            List<String> blockers,
            List<String> warnings) {

        // DOCS_LINK_PROVIDED
        boolean hasDocs = evidences.stream()
                .anyMatch(e -> e.getType() == EvidenceType.DOCUMENT 
                        || (e.getFileUrl() != null && !e.getFileUrl().trim().isEmpty()) 
                        || (e.getExternalUrl() != null && !e.getExternalUrl().trim().isEmpty()));
        gateChecks.add(GateCheck.builder()
                .name("DOCS_LINK_PROVIDED")
                .status(hasDocs ? "PASS" : "FAIL")
                .detail(hasDocs ? "Documentation link provided." : "Missing documentation link.")
                .build());
        if (!hasDocs) {
            blockers.add("Documentation link is required.");
        }

        // DOCS_ACCESSIBILITY
        boolean docConfirmed = evidences.stream()
                .filter(e -> e.getType() == EvidenceType.DOCUMENT)
                .anyMatch(e -> e.getStatus() == EvidenceStatus.ACCEPTED);
        gateChecks.add(GateCheck.builder()
                .name("DOCS_ACCESSIBILITY")
                .status(docConfirmed ? "PASS" : "WARNING")
                .detail(docConfirmed ? "Documentation accessibility confirmed." : "Documentation is pending confirmation.")
                .build());
        if (!docConfirmed) {
            warnings.add("Documentation accessibility confirmation is pending.");
        }
    }

    private void evaluateUiUxChecklist(
            List<Evidence> evidences,
            List<GateCheck> gateChecks,
            List<String> blockers,
            List<String> warnings) {

        // DESIGN_FILE_PROVIDED
        boolean hasDesign = evidences.stream()
                .anyMatch(e -> e.getType() == EvidenceType.FIGMA_LINK);
        gateChecks.add(GateCheck.builder()
                .name("DESIGN_FILE_PROVIDED")
                .status(hasDesign ? "PASS" : "FAIL")
                .detail(hasDesign ? "Design figma link provided." : "No figma link linked.")
                .build());
        if (!hasDesign) {
            blockers.add("Design figma link is required.");
        }

        // ASSETS_OR_SCREENSHOTS
        boolean hasAssets = evidences.stream()
                .anyMatch(e -> e.getType() == EvidenceType.SCREENSHOT || e.getType() == EvidenceType.SCREEN_RECORDING);
        gateChecks.add(GateCheck.builder()
                .name("ASSETS_OR_SCREENSHOTS")
                .status(hasAssets ? "PASS" : "FAIL")
                .detail(hasAssets ? "Design assets or screenshots provided." : "No screenshots or recording linked.")
                .build());
        if (!hasAssets) {
            blockers.add("UI screenshots or recordings are required.");
        }
    }

    private void evaluateTestingChecklist(
            List<Evidence> evidences,
            List<GateCheck> gateChecks,
            List<String> blockers,
            List<String> warnings) {

        // TEST_CASE_DOC
        boolean hasTestPlan = evidences.stream()
                .anyMatch(e -> e.getType() == EvidenceType.DOCUMENT || e.getType() == EvidenceType.TEST_RESULT);
        gateChecks.add(GateCheck.builder()
                .name("TEST_CASE_DOC")
                .status(hasTestPlan ? "PASS" : "FAIL")
                .detail(hasTestPlan ? "Test plan or cases doc provided." : "No test plan or cases doc linked.")
                .build());
        if (!hasTestPlan) {
            blockers.add("Test plan document is required.");
        }

        // TEST_EXECUTION_REPORT
        boolean hasReport = evidences.stream()
                .anyMatch(e -> e.getType() == EvidenceType.TEST_RESULT 
                        || e.getType() == EvidenceType.SCREENSHOT 
                        || e.getType() == EvidenceType.SCREEN_RECORDING);
        gateChecks.add(GateCheck.builder()
                .name("TEST_EXECUTION_REPORT")
                .status(hasReport ? "PASS" : "FAIL")
                .detail(hasReport ? "Test execution report/result found." : "No test execution report linked.")
                .build());
        if (!hasReport) {
            blockers.add("Test execution report is required.");
        }
    }

    private void evaluateGenericChecklist(
            List<Evidence> evidences,
            TaskReviewDecisionResponse.ReviewEvidenceSummary score,
            List<GateCheck> gateChecks,
            List<String> blockers,
            List<String> warnings) {

        // EVIDENCE_PROVIDED
        boolean hasEvidence = !evidences.isEmpty() || score.getCommitCount() > 0 || score.getPullRequestCount() > 0;
        gateChecks.add(GateCheck.builder()
                .name("EVIDENCE_PROVIDED")
                .status(hasEvidence ? "PASS" : "FAIL")
                .detail(hasEvidence ? "Task evidence provided." : "No evidence linked to task.")
                .build());
        if (!hasEvidence) {
            blockers.add("Evidence is required to approve this task.");
        }

        // EVIDENCE_CONFIRMED
        boolean anyConfirmed = evidences.isEmpty() || evidences.stream()
                .anyMatch(e -> e.getStatus() == EvidenceStatus.ACCEPTED);
        gateChecks.add(GateCheck.builder()
                .name("EVIDENCE_CONFIRMED")
                .status(anyConfirmed ? "PASS" : "WARNING")
                .detail(anyConfirmed ? "Evidence confirmed by leader/peer." : "Evidence is pending confirmation.")
                .build());
        if (!anyConfirmed) {
            warnings.add("Evidence confirmation is pending.");
        }
    }

    private boolean hasPendingManualEvidence(Task task) {
        return task != null && task.getId() != null
                && !manualEvidenceLinkRepository.findByTaskIdAndStatus(
                task.getId(),
                ManualEvidenceLinkStatus.PENDING).isEmpty();
    }

    private ProjectCodeInsightSettings defaultSettings() {
        return ProjectCodeInsightSettings.builder()
                .reviewGateEnabled(true)
                .requirePrForDone(false)
                .requireCiPass(false)
                .aiReviewEnabled(true)
                .minScoreWarningThreshold(70)
                .blockScoreThreshold(50)
                .build();
    }
}
