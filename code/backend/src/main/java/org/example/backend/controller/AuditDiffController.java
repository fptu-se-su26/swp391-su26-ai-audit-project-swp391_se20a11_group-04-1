package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.TaskRequest;
import org.example.backend.dto.UseCaseRequest;
import org.example.backend.entity.AuditLog;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.RequirementService;
import org.example.backend.service.TaskService;
import org.example.backend.service.UseCaseService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.Map;

@RestController
@RequestMapping("/api/audit-diff")
@RequiredArgsConstructor
public class AuditDiffController {

    private final AuditLogRepository auditLogRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskService taskService;
    private final RequirementService requirementService;
    private final UseCaseService useCaseService;
    private final ObjectMapper objectMapper;
    private final org.example.backend.scheduler.AuditEmailDigestScheduler emailDigestScheduler;

    @GetMapping("/{id}")
    public ResponseEntity<?> getAuditDiff(@PathVariable Long id, HttpSession session) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditLog not found"));
        
        boolean canRevert = false;
        boolean canApprove = false;
        Long userId = (Long) session.getAttribute("userId");
        String status = auditLog.getStatus();
        String action = auditLog.getAction();
        boolean isProcessed = "REVERTED".equals(status) || "APPROVED".equals(status) || (action != null && action.contains("REVERT_"));
        
        if (userId != null && auditLog.getProjectId() != null && !isProcessed) {
            boolean isLeader = projectMemberRepository.findByProjectIdAndUserId(auditLog.getProjectId(), userId)
                    .map(pm -> "LEADER".equals(pm.getRole().getName()) || "PROJECT_LEADER".equals(pm.getRole().getName()))
                    .orElse(false);
            canRevert = isLeader;
            canApprove = isLeader;
        }

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", auditLog.getId());
        response.put("action", auditLog.getAction());
        response.put("entityType", auditLog.getEntityType());
        response.put("entityId", auditLog.getEntityId());
        response.put("username", auditLog.getUsername());
        response.put("oldValue", auditLog.getOldValue());
        response.put("newValue", auditLog.getNewValue());
        response.put("createdAt", auditLog.getCreatedAt());
        response.put("status", auditLog.getStatus());
        response.put("canRevert", canRevert);
        response.put("canApprove", canApprove);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/revert")
    public ResponseEntity<?> revertChange(@PathVariable Long id, HttpSession session, jakarta.servlet.http.HttpServletRequest request) {
        request.setAttribute("isRevertAction", true);
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditLog not found"));

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        boolean isLeader = projectMemberRepository.findByProjectIdAndUserId(auditLog.getProjectId(), userId)
                .map(pm -> "LEADER".equals(pm.getRole().getName()) || "PROJECT_LEADER".equals(pm.getRole().getName()))
                .orElse(false);
                
        if (!isLeader) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("error", "Only leaders can revert changes"));
        }

        try {
            JsonNode oldNode = objectMapper.readTree(auditLog.getOldValue());
            
            switch (auditLog.getEntityType().toUpperCase()) {
                case "TASK":
                    TaskRequest taskReq = objectMapper.convertValue(oldNode, TaskRequest.class);
                    if (oldNode.has("primaryAssignee") && !oldNode.get("primaryAssignee").isNull()) {
                        taskReq.setPrimaryAssigneeId(oldNode.get("primaryAssignee").get("id").asLong());
                    }
                    if (taskReq.getChecklist() == null && oldNode.has("checklist") && !oldNode.get("checklist").isNull()) {
                        taskReq.setChecklist(objectMapper.convertValue(oldNode.get("checklist"), new com.fasterxml.jackson.core.type.TypeReference<java.util.List<org.example.backend.dto.TaskRequest.ChecklistItemRequest>>() {}));
                    }
                    taskService.updateTask(auditLog.getEntityId(), taskReq, userId);
                    break;
                case "REQUIREMENT":
                    RequirementRequestDTO reqDto = objectMapper.convertValue(oldNode, RequirementRequestDTO.class);
                    reqDto.setProjectId(auditLog.getProjectId());
                    requirementService.updateRequirement(auditLog.getEntityId(), reqDto, userId);
                    break;
                case "USE_CASE":
                    UseCaseRequest ucReq = objectMapper.convertValue(oldNode, UseCaseRequest.class);
                    useCaseService.updateUseCase(auditLog.getEntityId(), auditLog.getProjectId(), ucReq, userId);
                    break;
                default:
                    throw new IllegalArgumentException("Unsupported entity type for revert: " + auditLog.getEntityType());
            }
            
            // Mark as reverted so it cannot be reverted again
            auditLog.setStatus("REVERTED");
            auditLogRepository.save(auditLog);

            return ResponseEntity.ok(Map.of("message", "Reverted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveChange(@PathVariable Long id, HttpSession session) {
        AuditLog auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditLog not found"));

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        
        boolean isLeader = projectMemberRepository.findByProjectIdAndUserId(auditLog.getProjectId(), userId)
                .map(pm -> "LEADER".equals(pm.getRole().getName()) || "PROJECT_LEADER".equals(pm.getRole().getName()))
                .orElse(false);
                
        if (!isLeader) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("error", "Only leaders can approve changes"));
        }

        try {
            auditLog.setStatus("APPROVED");
            auditLogRepository.save(auditLog);
            return ResponseEntity.ok(Map.of("message", "Approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
