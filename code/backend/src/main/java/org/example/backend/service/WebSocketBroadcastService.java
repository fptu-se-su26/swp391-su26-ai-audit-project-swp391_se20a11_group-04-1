package org.example.backend.service;

public interface WebSocketBroadcastService {
    void broadcastReviewStarted(Long projectId, Long taskId, Long reviewerId);
    void broadcastReviewCompleted(Long projectId, Long taskId, Long reviewId, String riskLevel);
    void broadcastGateUpdated(Long projectId, Long taskId, String gateResult, String evidenceConfidence);
    void broadcastEvidenceLinked(Long projectId, Long taskId, String evidenceType, String source);
    void broadcastEvidenceUpdated(Long projectId, Long taskId, String evidenceType, String newState);
}
