package org.example.backend.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class AuditEvent extends ApplicationEvent {

    private final Long userId;
    private final String username;
    private final String action;
    private final String entityType;
    private final Long entityId;
    private final Long projectId;
    private final Object oldValue;
    private final Object newValue;
    private final String ipAddress;
    private final String httpMethod;
    private final String requestUri;
    private final String status;
    private final String errorMessage;
    private final long durationMs;

    public AuditEvent(Object source, Long userId, String username, String action, String entityType, Long entityId,
                      Long projectId, Object oldValue, Object newValue, String ipAddress, String httpMethod, String requestUri,
                      String status, String errorMessage, long durationMs) {
        super(source);
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.projectId = projectId;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.ipAddress = ipAddress;
        this.httpMethod = httpMethod;
        this.requestUri = requestUri;
        this.status = status;
        this.errorMessage = errorMessage;
        this.durationMs = durationMs;
    }
}
