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
import org.example.backend.repository.EntitySyncLogRepository;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.entity.AuditLog;
import org.example.backend.entity.EntitySyncLog;
import org.example.backend.dto.EntitySyncLogResponse;
import org.example.backend.dto.SyncStatsResponse;
import org.example.backend.dto.AuditLogResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminJobDashboardController {

    private final SchedulerRunLogRepository schedulerRunLogRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final DeadLetterEventRepository deadLetterEventRepository;
    private final EntitySyncLogRepository entitySyncLogRepository;
    private final AuditLogRepository auditLogRepository;

    private <T> ResponseEntity<ApiResponse<T>> unauthorized() {
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
    @org.example.backend.annotation.Auditable(action = "DLQ_RETRY", entityType = "OutboxEvent")
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

    @GetMapping("/sync/logs")
    public ResponseEntity<ApiResponse<Page<EntitySyncLogResponse>>> getSyncLogs(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<EntitySyncLog> logsPage = (status != null && !status.isEmpty())
                ? entitySyncLogRepository.findByStatusIn(java.util.List.of(status), pageable)
                : entitySyncLogRepository.findAll(pageable);

        return ResponseEntity.ok(ApiResponse.success(logsPage.map(EntitySyncLogResponse::fromEntity), "Success"));
    }

    @GetMapping("/sync/stats")
    public ResponseEntity<ApiResponse<SyncStatsResponse>> getSyncStats(HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();

        return ResponseEntity.ok(ApiResponse.success(SyncStatsResponse.builder()
                .pending(entitySyncLogRepository.countByStatus("PENDING"))
                .success(entitySyncLogRepository.countByStatus("SUCCESS"))
                .failed(entitySyncLogRepository.countByStatus("FAILED"))
                .retryPending(entitySyncLogRepository.countByStatus("RETRY_PENDING"))
                .dead(entitySyncLogRepository.countByStatus("DEAD"))
                .build(), "Success"));
    }

    @PostMapping("/sync/retry/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> retrySyncLog(@PathVariable Long id, HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();

        EntitySyncLog syncLog = entitySyncLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sync log not found"));

        syncLog.setRetryCount(0);
        syncLog.setStatus("RETRY_PENDING");
        syncLog.setNextRetryAt(LocalDateTime.now());
        entitySyncLogRepository.save(syncLog);

        return ResponseEntity.ok(ApiResponse.success("Sync retry requested"));
    }

    @GetMapping("/audit/logs")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> logs;

        if (userId != null) {
            logs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        } else if (action != null && !action.isBlank()) {
            logs = auditLogRepository.findByActionContaining(action, pageable);
        } else {
            logs = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(logs.map(AuditLogResponse::fromEntity), "Success"));
    }

    @GetMapping("/audit/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuditStats(HttpSession session) {
        if (session.getAttribute("userId") == null) return unauthorized();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        long totalToday = auditLogRepository.countByCreatedAtAfter(startOfDay);
        long failedToday = auditLogRepository.countByStatusAndCreatedAtAfter("FAILED", startOfDay);
        long suspiciousUsers = auditLogRepository.findSuspiciousUserIds().size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalToday", totalToday);
        stats.put("failedToday", failedToday);
        stats.put("suspiciousUsers", suspiciousUsers);

        return ResponseEntity.ok(ApiResponse.success(stats, "Success"));
    }
}
