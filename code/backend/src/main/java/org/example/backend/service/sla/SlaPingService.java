package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.example.backend.service.EmailService;
import org.example.backend.service.GeminiService;
import org.example.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
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
    private final GeminiService geminiService;

    @Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

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

        String taskUrl = appBaseUrl + "/projects/" + projectId + "/tasks/" + taskId;
        
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
    public String generateMemberAiEvaluation(Long projectId, Long sprintId, String assigneeName) {
        List<TaskSlaState> states = taskSlaStateRepository.findByProjectIdAndSprintIdWithTask(projectId, sprintId);

        List<TaskSlaState> allMemberStates = states.stream()
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

        List<TaskSlaState> memberRiskStates = allMemberStates.stream()
                .filter(s -> !"NORMAL".equals(s.getCurrentRiskLevel()))
                .toList();

        java.time.LocalDate today = java.time.LocalDate.now();
        int totalTasks = allMemberStates.size();
        int doneTasks = (int) allMemberStates.stream().filter(s -> s.getTask().getStatus() == TaskStatus.DONE).count();
        int overdueCount = (int) allMemberStates.stream()
                .filter(s -> s.getTask().getDeadline() != null && today.isAfter(s.getTask().getDeadline()) && s.getTask().getStatus() != TaskStatus.DONE)
                .count();
        int penaltyCount = (int) allMemberStates.stream().filter(s -> s.getTask().isOverduePenaltyApplied()).count();
        int criticalCount = (int) memberRiskStates.stream().filter(s -> "CRITICAL".equals(s.getCurrentRiskLevel())).count();
        int highCount = (int) memberRiskStates.stream().filter(s -> "HIGH".equals(s.getCurrentRiskLevel())).count();

        String riskTaskTitles = memberRiskStates.stream()
                .map(s -> "- " + s.getTask().getTitle() + " [" + s.getCurrentRiskLevel() + "]")
                .collect(java.util.stream.Collectors.joining("\n"));

        if (allMemberStates.isEmpty()) {
            return "## Performance Summary\nThành viên " + assigneeName + " chưa có task nào trong Sprint này.\n\n## Strengths\n- Chưa có dữ liệu\n\n## Areas for Improvement\n- Chưa có dữ liệu\n\n## Potential Risks\n- Chưa có dữ liệu";
        }

        String prompt = String.format("""
                Bạn là Agile Project Coach chuyên nghiệp. Dựa vào dữ liệu Sprint bên dưới, hãy viết báo cáo đánh giá thành viên bằng tiếng Việt.
                Trả về đúng 4 phần với tiêu đề Markdown (##), không thêm câu chào hay giải thích thừa:

                ## Performance Summary
                (1-2 câu tóm tắt tổng thể hiệu suất Sprint)

                ## Strengths
                (bullet points — điểm làm tốt, suy luận từ số task hoàn thành đúng hạn)

                ## Areas for Improvement
                (bullet points — vấn đề cụ thể dựa trên task trễ/bị phạt)

                ## Potential Risks
                (bullet points — rủi ro có thể xảy ra nếu không cải thiện)

                Dữ liệu thực tế:
                - Thành viên: %s
                - Tổng task được giao: %d | Đã hoàn thành: %d
                - Task trễ hạn: %d | Task bị penalty: %d
                - Task mức CRITICAL: %d | Task mức HIGH: %d
                - Danh sách task có vấn đề:
                %s
                """,
                assigneeName, totalTasks, doneTasks, overdueCount, penaltyCount,
                criticalCount, highCount,
                riskTaskTitles.isEmpty() ? "- (không có)" : riskTaskTitles
        );

        try {
            return geminiService.generateText(prompt);
        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini AI", e);
            return String.format(
                "## Performance Summary\n%s có %d/%d task hoàn thành, %d task trễ hạn và %d task bị penalty.\n\n## Strengths\n- Chưa thể phân tích (lỗi kết nối AI)\n\n## Areas for Improvement\n- %d task cần được xử lý gấp\n\n## Potential Risks\n- Tiến độ Sprint bị ảnh hưởng nếu không cải thiện",
                assigneeName, doneTasks, totalTasks, overdueCount, penaltyCount, memberRiskStates.size()
            );
        }
    }

    @Transactional
    public void pingRiskMember(Long projectId, Long sprintId, String assigneeName, String aiComment) {
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
        
        if (aiComment != null && !aiComment.trim().isEmpty()) {
            body.append("<div style=\"background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;\">");
            body.append("  <strong style=\"color: #991b1b; display: block; margin-bottom: 8px; font-size: 14px;\">🚨 Lời nhắn từ Quản lý Dự án (AI Assisted):</strong>");
            body.append("  <span style=\"color: #7f1d1d; font-size: 14px; line-height: 1.5;\">").append(aiComment).append("</span>");
            body.append("</div>");
        }
        
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
            String taskUrl = appBaseUrl + "/projects/" + projectId + "/tasks/" + task.getId();
            
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
