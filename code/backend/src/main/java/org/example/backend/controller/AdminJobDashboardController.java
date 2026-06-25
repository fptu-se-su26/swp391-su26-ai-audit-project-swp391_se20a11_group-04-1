package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.DeadLetterEventResponse;
import org.example.backend.dto.OutboxStatsResponse;
import org.example.backend.dto.SchedulerRunLogResponse;
import org.example.backend.entity.DeadLetterEvent;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.repository.DeadLetterEventRepository;
import org.example.backend.repository.OutboxEventRepository;
import org.example.backend.repository.SchedulerRunLogRepository;
import org.example.backend.service.event.OutboxEventService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminJobDashboardController {

    private final SchedulerRunLogRepository schedulerRunLogRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final DeadLetterEventRepository deadLetterEventRepository;

    private ResponseEntity<ApiResponse<Void>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
    }

    @GetMapping("/scheduler/runs")
    public ResponseEntity<ApiResponse<Page<SchedulerRunLogResponse>>> getSchedulerRuns(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();
        Page<SchedulerRunLogResponse> runs = schedulerRunLogRepository
                .findAllByOrderByStartedAtDesc(PageRequest.of(page, size))
                .map(SchedulerRunLogResponse::fromEntity);
        return ResponseEntity.ok(ApiResponse.success(runs, "Success"));
    }

    @GetMapping("/outbox/stats")
    public ResponseEntity<ApiResponse<OutboxStatsResponse>> getOutboxStats(HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();
        long pending = outboxEventRepository.countByStatus("PENDING");
        long published = outboxEventRepository.countByStatus("PUBLISHED");
        long dead = outboxEventRepository.countByStatus("DEAD");
        long dlqCount = deadLetterEventRepository.count();
        return ResponseEntity.ok(ApiResponse.success(OutboxStatsResponse.builder()
                .pending(pending)
                .published(published)
                .dead(dead)
                .dlqCount(dlqCount)
                .build(), "Success"));
    }

    @GetMapping("/dlq")
    public ResponseEntity<ApiResponse<Page<DeadLetterEventResponse>>> getDlqEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();
        Page<DeadLetterEventResponse> dlq = deadLetterEventRepository
                .findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .map(DeadLetterEventResponse::fromEntity);
        return ResponseEntity.ok(ApiResponse.success(dlq, "Success"));
    }

    @PostMapping("/dlq/{id}/retry")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> retryDlqEvent(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();
        DeadLetterEvent dlq = deadLetterEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("DLQ event not found"));
        
        dlq.setRetryStatus("RETRY_REQUESTED");
        dlq.setLastRetryAt(LocalDateTime.now());
        deadLetterEventRepository.save(dlq);

        Optional<OutboxEvent> originalEvent = outboxEventRepository.findById(dlq.getOriginalEventId());
        if (originalEvent.isPresent()) {
            OutboxEvent event = originalEvent.get();
            event.setStatus("PENDING");
            event.setRetryCount(0);
            event.setLastError(null);
            event.setNextRetryAt(null);
            outboxEventRepository.save(event);
        } else {
            // Recreate from DLQ (this is risky if we don't have all data like aggregateType or idempotencyKey, 
            // but we use placeholder or deterministic key)
            String fakeKey = "DLQ_RETRY_" + dlq.getId() + "_" + System.currentTimeMillis();
            OutboxEvent newEvent = OutboxEvent.builder()
                    .eventType(dlq.getEventType())
                    .aggregateType("UNKNOWN_FROM_DLQ")
                    .aggregateId(dlq.getAggregateId() != null ? Long.parseLong(dlq.getAggregateId()) : 0L)
                    .payload(dlq.getPayload())
                    .status("PENDING")
                    .retryCount(0)
                    .idempotencyKey(fakeKey)
                    .build();
            outboxEventRepository.save(newEvent);
        }

        return ResponseEntity.ok(ApiResponse.success("Retry requested"));
    }
}
