package org.example.backend.service;

import org.example.backend.constant.SyncTriggerType;
import org.example.backend.dto.event.SyncEvent;
import org.example.backend.entity.EntitySyncLog;
import org.example.backend.entity.Sprint;
import org.example.backend.entity.Task;
import org.example.backend.repository.EntitySyncLogRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.SyncStatusRepository;
import org.example.backend.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DataSyncServiceTest {

    @Mock
    private EntitySyncLogRepository syncLogRepository;
    @Mock
    private SyncStatusRepository syncStatusRepository;
    @Mock
    private SprintRepository sprintRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private WeeklyReportService weeklyReportService;

    @InjectMocks
    private DataSyncService dataSyncService;

    @BeforeEach
    void setUp() {
        when(syncLogRepository.save(any(EntitySyncLog.class))).thenAnswer(invocation -> {
            EntitySyncLog log = invocation.getArgument(0);
            if (log.getId() == null) {
                log.setId(1L);
            }
            return log;
        });
    }

    @Test
    void testHandleSyncEvent_TaskDone_UpdatesSprintProgress() {
        // Arrange
        Long taskId = 100L;
        Long sprintId = 200L;
        Long projectId = 300L;

        Task mockTask = new Task();
        mockTask.setId(taskId);
        mockTask.setSprintId(sprintId);

        Sprint mockSprint = new Sprint();
        mockSprint.setId(sprintId);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(mockTask));
        when(sprintRepository.findById(sprintId)).thenReturn(Optional.of(mockSprint));

        SyncEvent event = new SyncEvent(this, SyncTriggerType.TASK_STATUS_CHANGED, "Task", taskId, Map.of("projectId", projectId));

        // Act
        dataSyncService.handleSyncEvent(event);

        // Assert
        verify(taskRepository, times(1)).findById(taskId);
        verify(sprintRepository, times(1)).findById(sprintId);
        
        // Verifies upsert was called for Sprint
        verify(syncStatusRepository, times(1)).upsert(eq("Sprint"), eq(sprintId), any(LocalDateTime.class));

        // Verifies WebSocket message was sent
        ArgumentCaptor<Object> mapCaptor = ArgumentCaptor.forClass(Object.class);
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/project/300/sync"), mapCaptor.capture());
        
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) mapCaptor.getValue();
        assertNotNull(payload);
        assertEquals("TASK_STATUS_CHANGED", payload.get("triggerType"));
        assertEquals("Task", payload.get("entityType"));
        assertEquals(taskId, payload.get("entityId"));
        assertEquals("COMPLETED", payload.get("status"));

        // Verifies log was saved successfully
        ArgumentCaptor<EntitySyncLog> logCaptor = ArgumentCaptor.forClass(EntitySyncLog.class);
        // Note: save is called twice: once at the beginning, once at finally block
        verify(syncLogRepository, times(2)).save(logCaptor.capture());
        EntitySyncLog finalLog = logCaptor.getAllValues().get(1);
        assertEquals("SUCCESS", finalLog.getStatus());
    }
}
