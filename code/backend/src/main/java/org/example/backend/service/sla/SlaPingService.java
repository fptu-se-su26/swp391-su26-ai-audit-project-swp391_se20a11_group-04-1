package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.example.backend.service.EmailService;
import org.example.backend.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaPingService {

    private final TaskRepository taskRepository;
    private final TaskSlaStateRepository taskSlaStateRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public void pingTask(Long projectId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Task ID: " + taskId + " does not belong to Project ID: " + projectId);
        }

        UserAccount assignee = task.getPrimaryAssignee();
        if (assignee == null) {
            log.warn("Cannot ping an unassigned task (ID: {})", taskId);
            return;
        }

        String taskUrl = "http://localhost:5173/projects/" + projectId + "/tasks/" + taskId; // Fallback URL
        
        // Push in-app notification
        notificationService.createAndPush(
                assignee,
                task.getProject(),
                NotificationEntityType.TASK,
                taskId,
                NotificationType.SYSTEM,
                "SLA Warning: Action Required",
                "Your task '" + task.getTitle() + "' has been manually pinged due to SLA risks. Please review it."
        );

        // Send Email
        String subject = "🚨 SLA Warning: Action Required for Task ID " + taskId;
        String userName = assignee.getProfile() != null && assignee.getProfile().getFullName() != null ? assignee.getProfile().getFullName() : assignee.getUsername();
        
        String body = "<div style=\"font-family: Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto;\">"
                + "<h2 style=\"color: #0f172a;\">SLA Warning Notification</h2>"
                + "<p>Hello <strong>" + userName + "</strong>,</p>"
                + "<p>The project manager has manually pinged you regarding a task that is currently flagged with SLA risks or delays. Please review it immediately.</p>"
                + "<table style=\"width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #e2e8f0;\">"
                + "  <tr style=\"background-color: #f8fafc; text-align: left;\">"
                + "    <th style=\"padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569;\">Task ID</th>"
                + "    <th style=\"padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569;\">Title</th>"
                + "    <th style=\"padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569;\">Action</th>"
                + "  </tr>"
                + "  <tr>"
                + "    <td style=\"padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;\">ID-" + task.getId() + "</td>"
                + "    <td style=\"padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 500;\">" + task.getTitle() + "</td>"
                + "    <td style=\"padding: 12px; border-bottom: 1px solid #e2e8f0;\"><a href=\"" + taskUrl + "\" style=\"color: #2563eb; text-decoration: none; font-weight: bold;\">View Task &rarr;</a></td>"
                + "  </tr>"
                + "</table>"
                + "<br><p>Thank you.</p>"
                + "</div>";

        emailService.sendEmail(assignee.getEmail(), subject, body);
        log.info("Sent ping email to {} for Task ID: {}", assignee.getEmail(), taskId);
    }

    @Transactional
    public void pingRiskMember(Long projectId, Long sprintId, String assigneeName) {
        List<TaskSlaState> states = taskSlaStateRepository.findByProjectIdAndSprintIdWithTask(projectId, sprintId);
        
        List<TaskSlaState> memberRiskStates = states.stream()
                .filter(s -> !"NORMAL".equals(s.getCurrentRiskLevel()))
                .filter(s -> s.getTask().getPrimaryAssignee() != null)
                .filter(s -> {
                    String name = s.getTask().getPrimaryAssignee().getUsername();
                    if (s.getTask().getPrimaryAssignee().getProfile() != null && 
                        s.getTask().getPrimaryAssignee().getProfile().getFullName() != null && 
                        !s.getTask().getPrimaryAssignee().getProfile().getFullName().trim().isEmpty()) {
                        name = s.getTask().getPrimaryAssignee().getProfile().getFullName();
                    }
                    return name.equals(assigneeName);
                })
                .toList();

        if (memberRiskStates.isEmpty()) {
            log.info("No risk tasks found for member: {}", assigneeName);
            return;
        }

        UserAccount assignee = memberRiskStates.get(0).getTask().getPrimaryAssignee();
        
        // Push in-app notification
        notificationService.createAndPush(
                assignee,
                memberRiskStates.get(0).getTask().getProject(),
                NotificationEntityType.PROJECT, // General project ping
                projectId,
                NotificationType.SYSTEM,
                "SLA Warning: Multiple Tasks at Risk",
                "You have " + memberRiskStates.size() + " tasks at risk in the current sprint. Please review them immediately."
        );

        // Send Email
        String subject = "🚨 URGENT: " + memberRiskStates.size() + " Tasks at Risk in Sprint";
        StringBuilder body = new StringBuilder();
        body.append("<div style=\"font-family: Arial, sans-serif; color: #334155; max-width: 800px; margin: 0 auto;\">");
        body.append("<h2 style=\"color: #0f172a;\">Urgent SLA Warning</h2>");
        body.append("<p>Hello <strong>").append(assigneeName).append("</strong>,</p>");
        body.append("<p>You have <strong>").append(memberRiskStates.size()).append(" tasks</strong> currently flagged with SLA risks or delays in this sprint. The project manager has manually pinged you to take action.</p>");
        
        body.append("<table style=\"width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #e2e8f0; font-size: 14px;\">");
        body.append("  <thead style=\"background-color: #f8fafc; text-align: left;\">");
        body.append("    <tr>");
        body.append("      <th style=\"padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569;\">Task ID</th>");
        body.append("      <th style=\"padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569;\">Title</th>");
        body.append("      <th style=\"padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569;\">Risk Level</th>");
        body.append("      <th style=\"padding: 12px; border-bottom: 2px solid #e2e8f0; color: #475569;\">Action</th>");
        body.append("    </tr>");
        body.append("  </thead>");
        body.append("  <tbody>");
        
        for (TaskSlaState state : memberRiskStates) {
            Task task = state.getTask();
            String taskUrl = "http://localhost:5173/projects/" + projectId + "/tasks/" + task.getId();
            
            String riskBadge = "";
            if ("CRITICAL".equals(state.getCurrentRiskLevel())) {
                riskBadge = "<span style=\"background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;\">CRITICAL</span>";
            } else if ("HIGH".equals(state.getCurrentRiskLevel())) {
                riskBadge = "<span style=\"background-color: #ffedd5; color: #c2410c; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;\">HIGH</span>";
            } else {
                riskBadge = "<span style=\"background-color: #fef3c7; color: #b45309; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;\">" + state.getCurrentRiskLevel() + "</span>";
            }

            body.append("    <tr style=\"border-bottom: 1px solid #e2e8f0;\">");
            body.append("      <td style=\"padding: 12px; color: #64748b;\">ID-").append(task.getId()).append("</td>");
            body.append("      <td style=\"padding: 12px; font-weight: 500;\">").append(task.getTitle()).append("</td>");
            body.append("      <td style=\"padding: 12px;\">").append(riskBadge).append("</td>");
            body.append("      <td style=\"padding: 12px;\"><a href=\"").append(taskUrl).append("\" style=\"color: #2563eb; text-decoration: none; font-weight: bold;\">View Task &rarr;</a></td>");
            body.append("    </tr>");
        }
        
        body.append("  </tbody>");
        body.append("</table>");
        
        body.append("<p style=\"margin-top: 20px;\">Please review these tasks and update their status or request help if needed.</p><br><p>Thank you.</p>");
        body.append("</div>");

        emailService.sendEmail(assignee.getEmail(), subject, body.toString());
        log.info("Sent batch ping email to {} for {} tasks", assignee.getEmail(), memberRiskStates.size());
    }
}
