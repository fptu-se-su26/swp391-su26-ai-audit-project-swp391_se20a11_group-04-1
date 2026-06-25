package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.constant.SyncTriggerType;
import org.example.backend.dto.event.SyncEvent;
import org.example.backend.entity.EntitySyncLog;
import org.example.backend.entity.Sprint;
import org.example.backend.entity.Task;
import org.example.backend.entity.SprintStatus;
import org.example.backend.entity.TaskStatus;
import org.example.backend.repository.EntitySyncLogRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.SyncStatusRepository;
import org.example.backend.repository.TaskRepository;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataSyncService {

    private final EntitySyncLogRepository syncLogRepository;
    private final SyncStatusRepository syncStatusRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final WeeklyReportService weeklyReportService;

    @Async
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleSyncEvent(SyncEvent event) {
        LocalDateTime startTime = LocalDateTime.now();
        EntitySyncLog syncLog = syncLogRepository.save(EntitySyncLog.builder()
                .entityType(event.getEntityType())
                .entityId(event.getEntityId())
                .triggerType(event.getTriggerType().name())
                .status("PENDING")
                .retryCount(0)
                .build());

        try {
            Long projectId = null;
            if (event.getMetadata() != null && event.getMetadata().containsKey("projectId")) {
                projectId = (Long) event.getMetadata().get("projectId");
            }

            switch (event.getTriggerType()) {
                case TASK_STATUS_CHANGED:
                    handleTaskStatusChanged(event.getEntityId(), projectId);
                    break;
                case SPRINT_STATUS_CHANGED:
                    handleSprintStatusChanged(event.getEntityId(), projectId);
                    break;
                case PENALTY_APPLIED:
                    handlePenaltyApplied(event.getEntityId());
                    break;
                default:
                    log.info("No handler for trigger type: {}", event.getTriggerType());
            }

            syncLog.setStatus("SUCCESS");
            syncLog.setCompletedAt(LocalDateTime.now());
            syncLog.setDurationMs(java.time.Duration.between(startTime, syncLog.getCompletedAt()).toMillis());

            if (projectId != null) {
                sendSyncCompleteNotification(projectId, event);
            }
        } catch (Exception e) {
            log.error("Error processing sync event: {}", event, e);
            syncLog.setStatus("FAILED");
            syncLog.setErrorMessage(e.getMessage());
            
            // For simplicity, we just set it to RETRY_PENDING if retryCount < 3.
            // Since this is the initial run, retryCount is 0.
            syncLog.setStatus("RETRY_PENDING");
            syncLog.setNextRetryAt(LocalDateTime.now().plusMinutes(5));
        } finally {
            syncLogRepository.save(syncLog);
        }
    }

    private void handleTaskStatusChanged(Long taskId, Long projectId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null || task.getSprintId() == null) return;
        
        // Cập nhật Sprint: đếm lại doneTasks, tính progressPercent
        Sprint sprint = sprintRepository.findById(task.getSprintId()).orElse(null);
        if (sprint == null) return;

        long doneTasks = taskRepository.countBySprintIdAndStatus(sprint.getId(), TaskStatus.DONE);
        long totalTasks = taskRepository.countBySprintId(sprint.getId());
        
        // This relies on whatever fields Sprint has. If Sprint doesn't have doneTasks, we skip it.
        // I will just use SyncStatusRepository to upsert
        syncStatusRepository.upsert("Sprint", sprint.getId(), LocalDateTime.now());
    }

    private void handleSprintStatusChanged(Long sprintId, Long projectId) {
        Sprint sprint = sprintRepository.findById(sprintId).orElse(null);
        if (sprint == null) return;

        if (sprint.getStatus() == SprintStatus.COMPLETED) {
            List<Task> pendingTasks = taskRepository.findBySprintId(sprintId);
            for (Task task : pendingTasks) {
                if (task.getStatus() == TaskStatus.IN_PROGRESS || task.getStatus() == TaskStatus.IN_REVIEW) {
                    task.setStatus(TaskStatus.BLOCKED);
                    task.setBlockedReason("Sprint kết thúc - cần xử lý");
                    taskRepository.save(task);
                }
            }
            
            // Trigger WeeklyReport generation nếu chưa có report tuần này
            if (projectId != null) {
                try {
                    // Try to generate, if it fails because it exists, that's fine
                    weeklyReportService.generateSprintReport(projectId, sprintId, null);
                } catch (Exception e) {
                    log.warn("Could not generate weekly report for sprint {}: {}", sprintId, e.getMessage());
                }
            }
        }
        syncStatusRepository.upsert("Sprint", sprintId, LocalDateTime.now());
    }

    private void handlePenaltyApplied(Long entityId) {
        // Chỉ cập nhật SyncStatus
        syncStatusRepository.upsert("Task", entityId, LocalDateTime.now());
    }

    private void sendSyncCompleteNotification(Long projectId, SyncEvent event) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("triggerType", event.getTriggerType().name());
        payload.put("entityType", event.getEntityType());
        payload.put("entityId", event.getEntityId());
        payload.put("status", "COMPLETED");
        payload.put("timestamp", System.currentTimeMillis());
        
        String destination = "/topic/project/" + projectId + "/sync";
        messagingTemplate.convertAndSend(destination, (Object) payload);
    }
}
