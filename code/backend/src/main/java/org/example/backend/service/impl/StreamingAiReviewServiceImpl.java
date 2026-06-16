package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.*;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StreamingAiReviewServiceImpl implements StreamingAiReviewService {

    private final TaskRepository taskRepository;
    private final ProjectCodeInsightSettingsRepository settingsRepository;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final GitHubPullRequestFileRepository pullRequestFileRepository;
    private final CodeInsightPatchService patchService;
    private final CodeInsightScoringService scoringService;
    private final CodeInsightAiReviewInputBuilder inputBuilder;
    private final CodeInsightAiReviewRepository aiReviewRepository;
    private final ObjectMapper objectMapper;
    private final RequirementRepository requirementRepository;
    private final CodePatchAnalyzerService patchAnalyzerService;
    private final ReqDiffAlignmentService alignmentService;
    private final WebSocketBroadcastService webSocketBroadcastService;
    private final RestTemplate restTemplate;

    @Value("${code-insight.ai.model:${CODE_INSIGHT_AI_MODEL:gemini-2.5-flash}}")
    private String model;

    @Value("${code-insight.ai.api-key:${CODE_INSIGHT_AI_API_KEY:}}")
    private String apiKey;

    @Override
    @Transactional
    public void executeStreamingReview(Long projectId, Long taskId, Long userId, SseEmitter emitter) {
        try {
            log.info("Starting executeStreamingReview for taskId: {}", taskId);
            sendStatus(emitter, "STARTING", "Initializing AI review workflow...");

            Task task = taskRepository.findWithDetailsById(taskId)
                    .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
            if (task.getProject() == null || !projectId.equals(task.getProject().getId())) {
                throw new CustomException("Task does not belong to this project", HttpStatus.BAD_REQUEST);
            }
            ProjectCodeInsightSettings settings = settingsRepository.findByProjectId(projectId)
                    .orElse(ProjectCodeInsightSettings.builder().aiReviewEnabled(false).build());
            if (!settings.isAiReviewEnabled()) {
                throw new CustomException("AI Review is disabled for this project", HttpStatus.FORBIDDEN);
            }

            // Broadcast review started via WebSocket
            webSocketBroadcastService.broadcastReviewStarted(projectId, taskId, userId);

            sendStatus(emitter, "LOADING_EVIDENCE", "Fetching changed files and task evidence...");
            ensureChangedFilesLoaded(projectId, taskId, userId);

            // Fetch evidence stats for scoring
            TaskReviewDecisionResponse.ReviewEvidenceSummary score = scoringService.buildReviewEvidenceSummary(task);
            CodeInsightAiReviewInput aiInput = inputBuilder.build(task, score);

            List<Long> pullRequestIds = evidenceLinkRepository.findByTaskId(taskId).stream()
                    .filter(link -> link.getEvidenceType() == CodeInsightEvidenceType.PULL_REQUEST)
                    .map(CodeInsightEvidenceLink::getEvidenceId)
                    .distinct()
                    .toList();

            String rawDiff = "";
            if (!pullRequestIds.isEmpty()) {
                sendStatus(emitter, "ANALYZING_PATCH", "Preparing static code changes...");
                List<GitHubPullRequestFile> files = pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(pullRequestIds);
                StringBuilder rawDiffBuilder = new StringBuilder();
                for (GitHubPullRequestFile file : files) {
                    rawDiffBuilder.append("--- ").append(file.getFilePath()).append("\n");
                    rawDiffBuilder.append("+++ ").append(file.getFilePath()).append("\n");
                    if (file.getPatchSummary() != null) {
                        rawDiffBuilder.append(file.getPatchSummary()).append("\n");
                    }
                }
                rawDiff = rawDiffBuilder.toString();
            }

            List<String> acceptanceCriteria = List.of();
            if (task.getRequirementId() != null) {
                Requirement requirement = requirementRepository.findById(task.getRequirementId()).orElse(null);
                if (requirement != null && requirement.getAcceptanceCriteria() != null) {
                    try {
                        acceptanceCriteria = objectMapper.readValue(requirement.getAcceptanceCriteria(), new TypeReference<List<String>>() {});
                    } catch (Exception ex) {
                        log.error("Failed to parse acceptance criteria for requirement " + task.getRequirementId(), ex);
                    }
                }
            }

            if (!acceptanceCriteria.isEmpty()) {
                sendStatus(emitter, "REQ_ALIGNMENT", "Preparing requirement acceptance criteria...");
            }

            sendStatus(emitter, "GENERATING_REVIEW", "Analyzing patch, aligning requirements and evaluating risks...");

            if (apiKey == null || apiKey.isBlank()) {
                throw new IllegalStateException("AI provider API key is not configured.");
            }

            String promptInputJson = writeJson(aiInput);
            String prompt = buildStreamingPrompt(promptInputJson, rawDiff, acceptanceCriteria);

            // Call Gemini streaming endpoint (single API call)
            callGeminiStreaming(prompt, aiInput, null, task, emitter);

        } catch (Exception e) {
            log.error("Error in executeStreamingReview for taskId: " + taskId, e);
            try {
                emitter.send(SseEmitter.event()
                        .name("status")
                        .data(Map.of("phase", "ERROR", "message", e.getMessage())));
                emitter.complete();
            } catch (Exception ex) {
                log.error("Failed to send error event over SSE", ex);
            }
        }
    }

    private void ensureChangedFilesLoaded(Long projectId, Long taskId, Long userId) {
        List<Long> pullRequestIds = evidenceLinkRepository.findByTaskId(taskId).stream()
                .filter(link -> link.getEvidenceType() == CodeInsightEvidenceType.PULL_REQUEST)
                .map(CodeInsightEvidenceLink::getEvidenceId)
                .distinct()
                .toList();
        if (pullRequestIds.isEmpty()) return;
        if (!pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(pullRequestIds).isEmpty()) {
            return;
        }
        patchService.fetchChangedFiles(projectId, taskId, userId);
        if (pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(pullRequestIds).isEmpty()) {
            throw new CustomException("Changed files could not be loaded from GitHub. Please retry before running AI Review.", HttpStatus.BAD_REQUEST);
        }
    }

    private String buildStreamingPrompt(String promptInputJson, String rawDiff, List<String> acceptanceCriteria) {
        StringBuilder acText = new StringBuilder();
        if (acceptanceCriteria != null) {
            for (int i = 0; i < acceptanceCriteria.size(); i++) {
                acText.append(String.format("AC-%d: %s\n", i + 1, acceptanceCriteria.get(i)));
            }
        }

        return """
                You are Code Insight AI Review. You are advisory only and must not approve or reject tasks.
                
                First, output a detailed narrative analysis with code review feedback, security warnings, quality observations, and alignment notes.
                Use clear, engaging developer-friendly markdown.
                
                Once the narrative analysis is complete, write the exact delimiter text:
                ---JSON_START---
                
                Then, output a single structured JSON object containing your final evaluation matching this schema:
                {
                  "recommendation": "LIKELY_READY|NEEDS_REVIEW|BLOCKED_RISK|INSUFFICIENT_EVIDENCE",
                  "confidence": 0.0,
                  "scoreAdjustment": 0,
                  "summary": "short leader-facing summary",
                  "riskDetails": [{"severity":"INFO|LOW|MEDIUM|HIGH|CRITICAL","category":"EVIDENCE_GAP|CI_FAILURE|REQUIREMENT_MISMATCH|TEST_COVERAGE|SECURITY|QUALITY|SCOPE_RISK|AUTHOR_MISMATCH|LARGE_CHANGE","title":"...","detail":"..."}],
                  "questionsForLeader": ["..."],
                  "evidenceAssessment": {"requirementLinked":false,"githubIssueLinked":false,"hasCommitEvidence":false,"hasPullRequestEvidence":false,"ciPassed":false,"authorMatchesAssignee":false,"changedFilesReviewed":0,"binaryFilesSkipped":0,"truncatedFiles":0},
                  "reviewNotes": [{"file":"...","severity":"INFO|LOW|MEDIUM|HIGH|CRITICAL","lineHint":null,"message":"..."}],
                  "alignmentResult": {
                    "alignmentMatrix": [
                      {
                        "acText": "User can reset password",
                        "status": "FULLY_COVERED|PARTIAL|NOT_FOUND",
                        "evidenceDetail": "AuthService.java:resetPassword method implements the password reset logic",
                        "feedback": "Fully implemented"
                      }
                    ],
                    "coverageRatio": 0.8,
                    "coveredCount": 4,
                    "totalCount": 5,
                    "finalRiskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
                  }
                }
                
                Strict rules for alignmentResult status mapping:
                - FULLY_COVERED: There is clear evidence in the code changes implementing this specific AC.
                - PARTIAL: The AC is partly implemented, but some parts are hardcoded, missing validation, or left unfinished.
                - NOT_FOUND: No code changes relate to this AC.

                Strict rules for alignmentResult finalRiskLevel:
                - CRITICAL: Major security flaws (SQL injection, hardcoded auth, missing token check) or broken critical flows.
                - HIGH: Significant technical risks (N+1 query, unhandled exception in sensitive flow, poor performance).
                - MEDIUM: Moderate risks, partial AC coverage, or small code smells.
                - LOW: Standard clean code changes matching the AC.
                 Strict rules based on task type (found in review input JSON as task.type):
                 - Identify if the task is a non-code task (non-code task types include DOCUMENTATION, UI_UX, RESEARCH, and other tasks that do not write code).
                 - For non-code tasks, you MUST NOT generate technical warnings or risks related to git commits, pull requests, code regression, test coverage, or "No CI Pipeline" (e.g. lack of CI pipeline to verify doc syntax, lack of automated UI test runs, etc.). Warn only about actual missing requirements or documentation/links if relevant.
                 
                 Clamp confidence to 0..1 and scoreAdjustment to -15..15.
                 Do not put any markdown fences around the JSON.
                
                Review input JSON:
                """ + promptInputJson + """
                
                Git Diff of Changes:
                """ + (rawDiff != null && !rawDiff.isEmpty() ? rawDiff : "No diff available") + """
                
                Acceptance Criteria List:
                """ + acText.toString();
    }

    private void callGeminiStreaming(
            String prompt,
            CodeInsightAiReviewInput aiInput,
            ReqDiffAlignmentResult alignmentResult,
            Task task,
            SseEmitter emitter) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":streamGenerateContent?alt=sse";

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.2));

        try {
            restTemplate.execute(url, HttpMethod.POST, requestCallback -> {
                requestCallback.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                requestCallback.getHeaders().set("x-goog-api-key", apiKey);
                objectMapper.writeValue(requestCallback.getBody(), requestBody);
            }, response -> {
                if (!response.getStatusCode().is2xxSuccessful()) {
                    String errorBody = "";
                    try {
                        errorBody = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    } catch (Exception ignored) {}
                    
                    String errorMsg = "Gemini streaming call failed with status: " + response.getStatusCode();
                    if (!errorBody.isEmpty()) {
                        try {
                            JsonNode errorNode = objectMapper.readTree(errorBody);
                            String apiMsg = errorNode.at("/error/message").asText("");
                            if (!apiMsg.isEmpty()) {
                                errorMsg = apiMsg;
                            }
                        } catch (Exception ignored) {}
                    }
                    throw new IllegalStateException(errorMsg);
                }

                try (BufferedReader reader = new BufferedReader(new InputStreamReader(response.getBody(), StandardCharsets.UTF_8))) {
                    String line;
                    StringBuilder textBuffer = new StringBuilder();
                    StringBuilder jsonBuilder = new StringBuilder();
                    int sentLength = 0;
                    boolean jsonStarted = false;
                    String delimiter = "---JSON_START---";

                    while ((line = reader.readLine()) != null) {
                        if (line.startsWith("data:")) {
                            String data = line.substring(5).trim();
                            if (data.isEmpty()) continue;
                            JsonNode node = objectMapper.readTree(data);
                            String text = node.at("/candidates/0/content/parts/0/text").asText("");
                            if (!text.isEmpty()) {
                                textBuffer.append(text);

                                if (!jsonStarted) {
                                    int index = textBuffer.indexOf(delimiter);
                                    if (index >= 0) {
                                        String narrativePart = textBuffer.substring(0, index);
                                        String unsentNarrative = narrativePart.substring(sentLength);
                                        if (!unsentNarrative.isEmpty()) {
                                            sendChunk(emitter, unsentNarrative);
                                            sentLength = narrativePart.length();
                                        }
                                        jsonStarted = true;
                                        jsonBuilder.append(textBuffer.substring(index + delimiter.length()));
                                    } else {
                                        // Keep a safe margin so we don't send a split delimiter
                                        int safeLength = textBuffer.length() - delimiter.length();
                                        if (safeLength > sentLength) {
                                            String unsent = textBuffer.substring(sentLength, safeLength);
                                            sendChunk(emitter, unsent);
                                            sentLength = safeLength;
                                        }
                                    }
                                } else {
                                    jsonBuilder.append(text);
                                }
                            }
                        }
                    }

                    // Send any remaining unsent narrative text if the delimiter was never found
                    if (!jsonStarted && textBuffer.length() > sentLength) {
                        String unsent = textBuffer.substring(sentLength);
                        sendChunk(emitter, unsent);
                    }

                    String finalJson = jsonBuilder.toString().trim();
                    finalJson = stripCodeFence(finalJson);

                    CodeInsightAiReviewResponse reviewResponse;
                    if (!finalJson.isEmpty()) {
                        try {
                            reviewResponse = objectMapper.readValue(finalJson, CodeInsightAiReviewResponse.class);
                        } catch (Exception ex) {
                            log.error("Failed to parse final AI review JSON: " + finalJson, ex);
                            reviewResponse = buildFallbackReviewResponse("AI review JSON parse error: " + ex.getMessage());
                        }
                    } else {
                        reviewResponse = buildFallbackReviewResponse("No structured JSON returned by AI.");
                    }

                    // Save to DB and emit result
                    saveAndEmitResult(task, aiInput, reviewResponse, alignmentResult, emitter);
                }
                return null;
            });
        } catch (Exception ex) {
            log.error("Failed to execute Gemini streaming review", ex);
            throw new RuntimeException("Gemini streaming review failed: " + ex.getMessage(), ex);
        }
    }

    private CodeInsightAiReviewResponse buildFallbackReviewResponse(String errorDetail) {
        return CodeInsightAiReviewResponse.builder()
                .recommendation("NEEDS_REVIEW")
                .confidence(0.5)
                .summary("AI review completed with warnings. " + errorDetail)
                .riskDetails(List.of(CodeInsightAiReviewResponse.RiskDetail.builder()
                        .severity("MEDIUM")
                        .category("QUALITY")
                        .title("Review Incomplete")
                        .detail(errorDetail)
                        .build()))
                .questionsForLeader(List.of("Please verify the code changes manually."))
                .build();
    }

    private void saveAndEmitResult(
            Task task,
            CodeInsightAiReviewInput aiInput,
            CodeInsightAiReviewResponse reviewResponse,
            ReqDiffAlignmentResult alignmentResult,
            SseEmitter emitter) {

        String alignmentResultJson = null;
        Double alignmentCoverageRatio = null;
        Integer alignmentCoveredCount = null;
        Integer alignmentTotalCount = null;
        String codeRiskLevel = null;

        ReqDiffAlignmentResult finalAlignment = alignmentResult;
        if (reviewResponse != null && reviewResponse.getAlignmentResult() != null) {
            finalAlignment = reviewResponse.getAlignmentResult();
        }

        if (finalAlignment != null) {
            try {
                alignmentResultJson = objectMapper.writeValueAsString(finalAlignment);
                alignmentCoverageRatio = finalAlignment.getCoverageRatio();
                alignmentCoveredCount = finalAlignment.getCoveredCount();
                alignmentTotalCount = finalAlignment.getTotalCount();
                codeRiskLevel = finalAlignment.getFinalRiskLevel();
            } catch (Exception ex) {
                log.error("Failed to serialize alignment result for task " + task.getId(), ex);
            }
        }

        String promptInputJson = writeJson(aiInput);
        String preview = "Streaming review for Task " + task.getTitle();

        CodeInsightAiReview saved = aiReviewRepository.save(CodeInsightAiReview.builder()
                .task(task)
                .provider("GEMINI")
                .model(model)
                .recommendation(reviewResponse.getRecommendation())
                .confidence(toPercent(reviewResponse.getConfidence()))
                .summary(reviewResponse.getSummary())
                .promptInputJson(promptInputJson)
                .promptPreview(preview)
                .inputHash(sha256(promptInputJson))
                .riskDetailsJson(writeJson(reviewResponse.getRiskDetails()))
                .questionsForLeaderJson(writeJson(reviewResponse.getQuestionsForLeader()))
                .evidenceAssessmentJson(writeJson(reviewResponse.getEvidenceAssessment()))
                .reviewNotesJson(writeJson(reviewResponse.getReviewNotes()))
                .scoreAdjustment(clampAdjustment(reviewResponse.getScoreAdjustment()))
                .alignmentResultJson(alignmentResultJson)
                .alignmentCoverageRatio(alignmentCoverageRatio)
                .alignmentCoveredCount(alignmentCoveredCount)
                .alignmentTotalCount(alignmentTotalCount)
                .codeRiskLevel(codeRiskLevel)
                .build());

        // Map saved entity to the detailed response DTO
        CodeInsightAiReviewResponse finalResponse = toResponseDto(saved);
        sendResult(emitter, finalResponse);
        sendComplete(emitter, saved.getId());

        // Broadcast review completion via WebSockets
        webSocketBroadcastService.broadcastReviewCompleted(
                task.getProject().getId(),
                task.getId(),
                saved.getId(),
                codeRiskLevel != null ? codeRiskLevel : "LOW"
        );
    }

    private CodeInsightAiReviewResponse toResponseDto(CodeInsightAiReview review) {
        if (review == null) return null;
        List<CodeInsightAiReviewResponse.RiskDetail> riskDetails = readRiskDetails(review);
        List<String> questions = readQuestions(review);
        CodeInsightAiReviewResponse.EvidenceAssessment assessment = readValue(
                review.getEvidenceAssessmentJson(),
                CodeInsightAiReviewResponse.EvidenceAssessment.class,
                emptyAssessment());
        List<CodeInsightAiReviewResponse.ReviewNote> notes = readList(
                review.getReviewNotesJson(),
                new TypeReference<List<CodeInsightAiReviewResponse.ReviewNote>>() {});
        Map<String, Object> providerError = readMap(review.getProviderErrorJson());
        boolean legacy = review.getRiskDetailsJson() == null && (review.getRisksJson() != null || review.getReviewQuestionsJson() != null);

        return CodeInsightAiReviewResponse.builder()
                .id(review.getId())
                .provider(review.getProvider())
                .model(review.getModel())
                .recommendation(mapRecommendation(review.getRecommendation()))
                .confidence(review.getConfidence() / 100.0)
                .summary(review.getSummary())
                .riskDetails(riskDetails)
                .questionsForLeader(questions)
                .evidenceAssessment(assessment)
                .reviewNotes(notes)
                .providerError(providerError)
                .legacy(legacy)
                .scoreAdjustment(review.getScoreAdjustment())
                .alignmentResultJson(review.getAlignmentResultJson())
                .alignmentCoverageRatio(review.getAlignmentCoverageRatio())
                .alignmentCoveredCount(review.getAlignmentCoveredCount())
                .alignmentTotalCount(review.getAlignmentTotalCount())
                .codeRiskLevel(review.getCodeRiskLevel())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private List<CodeInsightAiReviewResponse.RiskDetail> readRiskDetails(CodeInsightAiReview review) {
        List<CodeInsightAiReviewResponse.RiskDetail> structured = readList(
                review.getRiskDetailsJson(),
                new TypeReference<List<CodeInsightAiReviewResponse.RiskDetail>>() {});
        if (!structured.isEmpty() || review.getRisksJson() == null) return structured;
        return readList(review.getRisksJson(), new TypeReference<List<String>>() {}).stream()
                .map(risk -> CodeInsightAiReviewResponse.RiskDetail.builder()
                        .severity("MEDIUM")
                        .category("QUALITY")
                        .title(risk)
                        .detail(risk)
                        .build())
                .toList();
    }

    private List<String> readQuestions(CodeInsightAiReview review) {
        List<String> structured = readList(review.getQuestionsForLeaderJson(), new TypeReference<List<String>>() {});
        return !structured.isEmpty() || review.getReviewQuestionsJson() == null
                ? structured
                : readList(review.getReviewQuestionsJson(), new TypeReference<List<String>>() {});
    }

    private String mapRecommendation(String recommendation) {
        if ("NEEDS_CHANGES".equals(recommendation)) return "BLOCKED_RISK";
        if ("REVIEW_CAREFULLY".equals(recommendation)) return "NEEDS_REVIEW";
        if (recommendation == null || recommendation.isBlank()) return "NEEDS_REVIEW";
        return recommendation;
    }

    private CodeInsightAiReviewResponse.EvidenceAssessment emptyAssessment() {
        return CodeInsightAiReviewResponse.EvidenceAssessment.builder().build();
    }

    private int toPercent(double confidence) {
        return Math.max(0, Math.min(100, (int) Math.round(confidence * 100)));
    }

    private int clampAdjustment(int value) {
        return Math.max(-15, Math.min(15, value));
    }

    private String writeJson(Object value) {
        try {
            return value == null ? null : objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private <T> List<T> readList(String json, TypeReference<List<T>> type) {
        try {
            return json != null ? objectMapper.readValue(json, type) : List.of();
        } catch (Exception ex) {
            return List.of();
        }
    }

    private <T> T readValue(String json, Class<T> type, T fallback) {
        try {
            return json != null ? objectMapper.readValue(json, type) : fallback;
        } catch (Exception ex) {
            return fallback;
        }
    }

    private Map<String, Object> readMap(String json) {
        try {
            return json != null ? objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {}) : null;
        } catch (Exception ex) {
            return null;
        }
    }

    private String stripCodeFence(String value) {
        String trimmed = value.trim();
        if (!trimmed.startsWith("```")) return trimmed;
        return trimmed.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "").trim();
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private void sendStatus(SseEmitter emitter, String phase, String message) {
        try {
            emitter.send(SseEmitter.event()
                    .name("status")
                    .data(Map.of("phase", phase, "message", message)));
        } catch (Exception ex) {
            log.warn("Failed to send status event over SSE", ex);
        }
    }

    private void sendChunk(SseEmitter emitter, String text) {
        try {
            emitter.send(SseEmitter.event()
                    .name("chunk")
                    .data(Map.of("text", text)));
        } catch (Exception ex) {
            log.warn("Failed to send chunk event over SSE", ex);
        }
    }

    private void sendAlignment(SseEmitter emitter, ReqDiffAlignmentResult alignment) {
        try {
            emitter.send(SseEmitter.event()
                    .name("alignment")
                    .data(alignment));
        } catch (Exception ex) {
            log.warn("Failed to send alignment event over SSE", ex);
        }
    }

    private void sendResult(SseEmitter emitter, CodeInsightAiReviewResponse response) {
        try {
            emitter.send(SseEmitter.event()
                    .name("result")
                    .data(response));
        } catch (Exception ex) {
            log.warn("Failed to send result event over SSE", ex);
        }
    }

    private void sendComplete(SseEmitter emitter, Long reviewId) {
        try {
            emitter.send(SseEmitter.event()
                    .name("complete")
                    .data(Map.of("status", "done", "reviewId", reviewId)));
        } catch (Exception ex) {
            log.warn("Failed to send complete event over SSE", ex);
        }
    }

    private void delay(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
