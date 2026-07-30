package org.example.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditDiffService {

    private final ObjectMapper objectMapper;
    private final AuditLogRepository auditLogRepository;
    private final NotificationService notificationService;
    private final ProjectMemberRepository projectMemberRepository;

    @Lazy
    @Autowired
    private AuditDiffService self;

    public void trackAndNotifyChanges(Project project, UserAccount actor, String entityTypeStr, Long entityId, 
                                      String entityTitle, Object oldEntity, Object newEntity) {
        boolean isRevertAction = false;
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null && Boolean.TRUE.equals(attrs.getRequest().getAttribute("isRevertAction"))) {
                isRevertAction = true;
            }
        } catch (Exception ignored) {}

        self.processTrackAndNotifyChanges(project, actor, entityTypeStr, entityId, entityTitle, oldEntity, newEntity, isRevertAction);
    }

    @Async
    public void processTrackAndNotifyChanges(Project project, UserAccount actor, String entityTypeStr, Long entityId, 
                                      String entityTitle, Object oldEntity, Object newEntity, boolean isRevertAction) {
        try {
            Map<String, Object> oldMap = objectMapper.convertValue(oldEntity, new TypeReference<Map<String, Object>>() {});
            Map<String, Object> newMap = objectMapper.convertValue(newEntity, new TypeReference<Map<String, Object>>() {});

            String[] ignoreFields = {"createdAt", "updatedAt", "version", "lastModifiedBy", "lastModifiedAt"};
            for (String field : ignoreFields) {
                oldMap.remove(field);
                newMap.remove(field);
            }

            String oldJson = objectMapper.writeValueAsString(oldMap);
            String newJson = objectMapper.writeValueAsString(newMap);

            if (!oldJson.equals(newJson)) {
                
                // If it is a revert action, it notifies as a revert. 
                // Normal updates notify as normal updates.

                AuditLog auditLog = AuditLog.builder()
                        .userId(actor.getId())
                        .username(actor.getUsername())
                        .action(isRevertAction ? "REVERT_" + entityTypeStr.toUpperCase() : "UPDATE_" + entityTypeStr.toUpperCase())
                        .entityType(entityTypeStr)
                        .entityId(entityId)
                        .projectId(project.getId())
                        .oldValue(oldJson)
                        .newValue(newJson)
                        .status("SUCCESS")
                        .build();

                auditLog = auditLogRepository.save(auditLog);

                if (!isRevertAction) {
                    // Notify all project members except the actor
                    List<ProjectMember> members = projectMemberRepository.findByProjectId(project.getId());
                    NotificationEntityType notifType = getNotificationType(entityTypeStr);
                    
                    String title = "Entity Updated: " + entityTitle;
                    String message = actor.getUsername() + " updated a " + entityTypeStr;

                    for (ProjectMember member : members) {
                        if (!member.getUser().getId().equals(actor.getId())) {
                            notificationService.createAndPush(member.getUser(), project, notifType, 
                                    auditLog.getId(), NotificationType.ENTITY_UPDATE, title, message);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("Failed to process audit diff for {} {}", entityTypeStr, entityId, e);
        }
    }

    private NotificationEntityType getNotificationType(String entityTypeStr) {
        switch (entityTypeStr.toUpperCase()) {
            case "REQUIREMENT": return NotificationEntityType.REQUIREMENT;
            case "USE_CASE": return NotificationEntityType.USE_CASE;
            case "TASK": return NotificationEntityType.TASK;
            default: return NotificationEntityType.PROJECT; // Fallback
        }
    }
}
