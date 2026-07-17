package org.example.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.entity.AuditLog;
import org.example.backend.event.AuditEvent;
import org.example.backend.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ApplicationEventPublisher applicationEventPublisher;

    @InjectMocks
    private AuditService auditService;

    @Test
    void testHandleAuditEvent_Success_SavesAuditLog() throws JsonProcessingException {
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        AuditEvent event = new AuditEvent(this, 1L, "user1", "CREATE_TASK", "Task", 100L,
                10L, null, "{}", "127.0.0.1", "POST", "/api/tasks", "SUCCESS", null, 150L);

        auditService.handleAuditEvent(event);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(captor.capture());

        AuditLog savedLog = captor.getValue();
        assertEquals("CREATE_TASK", savedLog.getAction());
        assertEquals("SUCCESS", savedLog.getStatus());
        assertEquals("127.0.0.1", savedLog.getIpAddress());
        assertEquals(100L, savedLog.getEntityId());
        assertEquals(150L, savedLog.getDurationMs());
    }

    @Test
    void testHandleAuditEvent_DoesNotThrow_WhenRepositoryFails() throws JsonProcessingException {
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        doThrow(new RuntimeException("DB Error")).when(auditLogRepository).save(any());

        AuditEvent event = new AuditEvent(this, 1L, "user1", "CREATE_TASK", "Task", 100L,
                10L, null, "{}", "127.0.0.1", "POST", "/api/tasks", "SUCCESS", null, 150L);

        assertDoesNotThrow(() -> auditService.handleAuditEvent(event));
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    void testPublishSuccess_PublishesAuditEvent() {
        auditService.publishSuccess(1L, "user1", "CREATE_TASK", "Task", 100L, 10L, "{}",
                "127.0.0.1", "POST", "/api/tasks", 150L);

        ArgumentCaptor<AuditEvent> captor = ArgumentCaptor.forClass(AuditEvent.class);
        verify(applicationEventPublisher, times(1)).publishEvent(captor.capture());

        AuditEvent publishedEvent = captor.getValue();
        assertEquals("CREATE_TASK", publishedEvent.getAction());
        assertEquals("SUCCESS", publishedEvent.getStatus());
        assertEquals("127.0.0.1", publishedEvent.getIpAddress());
        assertEquals(150L, publishedEvent.getDurationMs());
    }
}
