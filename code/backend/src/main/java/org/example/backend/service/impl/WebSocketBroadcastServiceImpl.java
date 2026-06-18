package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.NotificationWebSocketHandler;
import org.example.backend.service.WebSocketBroadcastService;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketBroadcastServiceImpl implements WebSocketBroadcastService {

    private final NotificationWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    @Override
    public void broadcastReviewStarted(Long projectId, Long taskId, Long reviewerId) {
        Map<String, Object> payload = Map.of(
                "type", "AI_REVIEW_STARTED",
                "projectId", projectId,
                "taskId", taskId,
                "reviewerId", reviewerId
        );
        send(payload);
    }

    @Override
    public void broadcastReviewCompleted(Long projectId, Long taskId, Long reviewId, String riskLevel) {
        Map<String, Object> payload = Map.of(
                "type", "AI_REVIEW_COMPLETED",
                "projectId", projectId,
                "taskId", taskId,
                "reviewId", reviewId,
                "riskLevel", riskLevel != null ? riskLevel : "UNKNOWN"
        );
        send(payload);
    }

    @Override
    public void broadcastGateUpdated(Long projectId, Long taskId, String gateResult, String evidenceConfidence) {
        Map<String, Object> payload = Map.of(
                "type", "GATE_UPDATED",
                "projectId", projectId,
                "taskId", taskId,
                "gateResult", gateResult != null ? gateResult : "BLOCKED",
                "evidenceConfidence", evidenceConfidence != null ? evidenceConfidence : "NONE"
        );
        send(payload);
    }

    @Override
    public void broadcastEvidenceLinked(Long projectId, Long taskId, String evidenceType, String source) {
        Map<String, Object> payload = Map.of(
                "type", "EVIDENCE_LINKED",
                "projectId", projectId,
                "taskId", taskId,
                "evidenceType", evidenceType,
                "source", source != null ? source : "AUTO"
        );
        send(payload);
    }

    @Override
    public void broadcastEvidenceUpdated(Long projectId, Long taskId, String evidenceType, String newState) {
        Map<String, Object> payload = Map.of(
                "type", "EVIDENCE_UPDATED",
                "projectId", projectId,
                "taskId", taskId,
                "evidenceType", evidenceType,
                "newState", newState
        );
        send(payload);
    }

    private void send(Object payload) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            log.info("Broadcasting websocket message: {}", jsonPayload);
            webSocketHandler.broadcast(jsonPayload);
        } catch (Exception ex) {
            log.error("Failed to broadcast WebSocket message", ex);
        }
    }
}

