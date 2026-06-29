package org.example.backend.service.event;

import org.example.backend.entity.OutboxEvent;
import org.example.backend.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OutboxEventServiceTest {

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OutboxEventService outboxEventService;

    @Test
    void testCreateEvent_Success() {
        // Arrange
        String eventType = "TEST_EVENT";
        String aggregateType = "Task";
        Long aggregateId = 123L;
        Map<String, Object> payload = Map.of("key", "value");

        when(outboxEventRepository.saveAndFlush(any(OutboxEvent.class))).thenAnswer(invocation -> {
            OutboxEvent event = invocation.getArgument(0);
            event.setId(1L);
            return event;
        });

        // Act
        OutboxEvent result = outboxEventService.createEvent(eventType, aggregateType, aggregateId, payload);

        // Assert
        ArgumentCaptor<OutboxEvent> captor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxEventRepository).saveAndFlush(captor.capture());

        OutboxEvent savedEvent = captor.getValue();
        assertEquals(eventType, savedEvent.getEventType());
        assertEquals(aggregateType, savedEvent.getAggregateType());
        assertEquals(aggregateId, savedEvent.getAggregateId());
        assertEquals("PENDING", savedEvent.getStatus());
        assertNotNull(savedEvent.getIdempotencyKey());
        assertFalse(savedEvent.getIdempotencyKey().isEmpty());
    }

    @Test
    void testIdempotencyKey_IsDeterministic() {
        // Same input must always produce same key
        String eventType = "TEST_EVENT";
        Long aggregateId = 123L;
        Map<String, Object> payload = Map.of("key", "value");

        when(outboxEventRepository.saveAndFlush(any(OutboxEvent.class))).thenAnswer(invocation -> {
            OutboxEvent event = invocation.getArgument(0);
            event.setId(1L);
            return event;
        });

        OutboxEvent first = outboxEventService.createEvent(eventType, "Task", aggregateId, payload);

        when(outboxEventRepository.saveAndFlush(any(OutboxEvent.class))).thenAnswer(invocation -> {
            OutboxEvent event = invocation.getArgument(0);
            event.setId(2L);
            return event;
        });

        OutboxEvent second = outboxEventService.createEvent(eventType, "Task", aggregateId, payload);

        assertEquals(first.getIdempotencyKey(), second.getIdempotencyKey());
    }

    @Test
    void testCreateEvent_Duplicate_IdempotencyKey() {
        // Arrange
        String eventType = "TEST_EVENT";
        String aggregateType = "Task";
        Long aggregateId = 123L;
        Map<String, Object> payload = Map.of("key", "value");

        when(outboxEventRepository.saveAndFlush(any(OutboxEvent.class)))
                .thenThrow(new DataIntegrityViolationException("Unique constraint violation"));

        OutboxEvent existingEvent = OutboxEvent.builder()
                .id(2L)
                .eventType(eventType)
                .aggregateId(aggregateId)
                .status("PENDING")
                .build();
        when(outboxEventRepository.findByIdempotencyKey(anyString()))
                .thenReturn(Optional.of(existingEvent));

        // Act & Assert — must not throw, must return existing event silently
        assertDoesNotThrow(() -> {
            OutboxEvent result = outboxEventService.createEvent(eventType, aggregateType, aggregateId, payload);
            assertNotNull(result);
            assertEquals(2L, result.getId());
        });

        verify(outboxEventRepository, times(1)).saveAndFlush(any(OutboxEvent.class));
        verify(outboxEventRepository, times(1)).findByIdempotencyKey(anyString());
    }
}
