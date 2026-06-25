package org.example.backend.dto.event;

import lombok.Getter;
import org.example.backend.constant.SyncTriggerType;
import org.springframework.context.ApplicationEvent;

import java.util.Map;

@Getter
public class SyncEvent extends ApplicationEvent {

    private final SyncTriggerType triggerType;
    private final String entityType;
    private final Long entityId;
    private final Map<String, Object> metadata;

    public SyncEvent(Object source, SyncTriggerType triggerType, String entityType, Long entityId, Map<String, Object> metadata) {
        super(source);
        this.triggerType = triggerType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.metadata = metadata;
    }
}
