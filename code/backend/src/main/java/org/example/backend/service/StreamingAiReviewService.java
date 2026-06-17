package org.example.backend.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface StreamingAiReviewService {
    void executeStreamingReview(Long projectId, Long taskId, Long userId, SseEmitter emitter);
}
