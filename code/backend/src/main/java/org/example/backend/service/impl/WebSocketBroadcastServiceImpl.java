package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.service.WebSocketBroadcastService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketBroadcastServiceImpl implements WebSocketBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void broadcastReviewStarted(Long projectId, Long taskId, Long reviewerId) {
        String destination = "/topic/project/" + projectId + "/review";
        Map<String, Object> payload = Map.of(
                "type", "AI_REVIEW_STARTED",
                "taskId", taskId,
                "reviewerId", reviewerId
        );
        send(destination, payload);
    }

    @Override
    public void broadcastReviewCompleted(Long projectId, Long taskId, Long reviewId, String riskLevel) {
        String destination = "/topic/project/" + projectId + "/review";
        Map<String, Object> payload = Map.of(
                "type", "AI_REVIEW_COMPLETED",
                "taskId", taskId,
                "reviewId", reviewId,
                "riskLevel", riskLevel != null ? riskLevel : "UNKNOWN"
        );
        send(destination, payload);
    }

    @Override
    public void broadcastGateUpdated(Long projectId, Long taskId, String gateResult, String evidenceConfidence) {
        String destination = "/topic/project/" + projectId + "/review";
        Map<String, Object> payload = Map.of(
                "type", "GATE_UPDATED",
                "taskId", taskId,
                "gateResult", gateResult != null ? gateResult : "BLOCKED",
                "evidenceConfidence", evidenceConfidence != null ? evidenceConfidence : "NONE"
        );
        send(destination, payload);
    }

    @Override
    public void broadcastEvidenceLinked(Long projectId, Long taskId, String evidenceType, String source) {
        String destination = "/topic/project/" + projectId + "/evidence";
        Map<String, Object> payload = Map.of(
                "type", "EVIDENCE_LINKED",
                "taskId", taskId,
                "evidenceType", evidenceType,
                "source", source != null ? source : "AUTO"
        );
        send(destination, payload);
    }

    @Override
    public void broadcastEvidenceUpdated(Long projectId, Long taskId, String evidenceType, String newState) {
        String destination = "/topic/project/" + projectId + "/evidence";
        Map<String, Object> payload = Map.of(
                "type", "EVIDENCE_UPDATED",
                "taskId", taskId,
                "evidenceType", evidenceType,
                "newState", newState
        );
        send(destination, payload);
    }

    @Override
    public void broadcastSprintAiDone(Long projectId, Long sprintId) {
        String destination = "/topic/project/" + projectId + "/sprint-ai";
        Map<String, Object> payload = Map.of("type", "AI_SPRINT_DONE", "sprintId", sprintId);
        send(destination, payload);
    }

    private void send(String destination, Object payload) {
        try {
            log.info("Broadcasting websocket message to destination {}: {}", destination, payload);
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception ex) {
            log.error("Failed to broadcast WebSocket message to " + destination, ex);
        }
    }
}
