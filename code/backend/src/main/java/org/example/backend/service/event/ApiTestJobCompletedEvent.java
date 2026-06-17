package org.example.backend.service.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class ApiTestJobCompletedEvent extends ApplicationEvent {
    private final UUID taskId;
    private final String payload;

    public ApiTestJobCompletedEvent(UUID taskId, String payload) {
        super(taskId); // The source is the taskId
        this.taskId = taskId;
        this.payload = payload;
    }
}
