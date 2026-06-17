package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.exception.CustomException;
import org.example.backend.service.StreamingAiReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/task-reviews")
@RequiredArgsConstructor
@Slf4j
public class StreamingAiReviewController {

    private final StreamingAiReviewService streamingAiReviewService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @GetMapping(value = "/{taskId}/ai-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAiReview(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        log.info("SSE subscription request received for projectId: {}, taskId: {}, userId: {}", projectId, taskId, userId);

        SseEmitter emitter = new SseEmitter(180000L); // 3-minute timeout

        executorService.submit(() -> {
            try {
                streamingAiReviewService.executeStreamingReview(projectId, taskId, userId, emitter);
                emitter.complete();
            } catch (Exception ex) {
                log.error("Streaming review failed for taskId: " + taskId, ex);
                try {
                    emitter.completeWithError(ex);
                } catch (Exception ignored) {}
            }
        });

        return emitter;
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
