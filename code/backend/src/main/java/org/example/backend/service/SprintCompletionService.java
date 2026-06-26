package org.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.SprintCompletionSummaryResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.sla.GeminiMemberNarrativeService;
import org.example.backend.service.sla.GeminiSprintNarrativeService;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SprintCompletionService {

    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final SprintCompletionSummaryRepository sprintCompletionSummaryRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final GeminiSprintNarrativeService geminiSprintNarrativeService;
    private final GeminiMemberNarrativeService geminiMemberNarrativeService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Async("monitoringExecutor")
    public void generate(Long sprintId, String triggeredBy) {
        log.info("Generating SprintCompletionSummary for sprintId: {}", sprintId);
        
        Optional<Sprint> sprintOpt = sprintRepository.findById(sprintId);
        if (sprintOpt.isEmpty()) {
            log.warn("Sprint not found for id: {}", sprintId);
            return;
        }
        Sprint sprint = sprintOpt.get();

        if (sprintCompletionSummaryRepository.findBySprintId(sprintId).isPresent()) {
            log.info("SprintCompletionSummary already exists for sprintId: {}", sprintId);
            return;
        }

        List<Task> tasks = taskRepository.findByProjectIdAndSprintIdOrderBySprintPlanDateAscUpdatedAtDesc(
                sprint.getProject().getId(), sprint.getId());

        int totalTasks = tasks.size();
        int completedTasks = 0;
        int completedOnTime = 0;
        int overdueTasks = 0;
        int penalizedTasks = 0;

        LocalDate today = LocalDate.now();

        for (Task task : tasks) {
            if (task.getStatus() == TaskStatus.DONE) {
                completedTasks++;
                if (task.getCompletedAt() != null && task.getDeadline() != null &&
                        !task.getCompletedAt().toLocalDate().isAfter(task.getDeadline())) {
                    completedOnTime++;
                }
            } else {
                if (task.getDeadline() != null && task.getDeadline().isBefore(today)) {
                    overdueTasks++;
                }
            }
            if (task.isOverduePenaltyApplied()) {
                penalizedTasks++;
            }
        }

        double completionRateDouble = totalTasks == 0 ? 0 : (double) completedTasks / totalTasks * 100.0;
        double onTimeRateDouble = totalTasks == 0 ? 0 : (double) completedOnTime / totalTasks * 100.0;

        BigDecimal completionRate = BigDecimal.valueOf(completionRateDouble).setScale(2, RoundingMode.HALF_UP);
        BigDecimal onTimeRate = BigDecimal.valueOf(onTimeRateDouble).setScale(2, RoundingMode.HALF_UP);

        Map<UserAccount, List<Task>> tasksByAssignee = tasks.stream()
                .filter(t -> t.getPrimaryAssignee() != null)
                .collect(Collectors.groupingBy(Task::getPrimaryAssignee));

        List<SprintMemberSummary> memberSummaries = new ArrayList<>();
        int redMembers = 0;

        for (Map.Entry<UserAccount, List<Task>> entry : tasksByAssignee.entrySet()) {
            UserAccount assignee = entry.getKey();
            List<Task> userTasks = entry.getValue();

            int mTotalAssigned = userTasks.size();
            int mCompletedOnTime = 0;
            int mOverdueCount = 0;
            int mPenalizedCount = 0;

            for (Task task : userTasks) {
                if (task.getStatus() == TaskStatus.DONE) {
                    if (task.getCompletedAt() != null && task.getDeadline() != null &&
                            !task.getCompletedAt().toLocalDate().isAfter(task.getDeadline())) {
                        mCompletedOnTime++;
                    }
                } else {
                    if (task.getDeadline() != null && task.getDeadline().isBefore(today)) {
                        mOverdueCount++;
                    }
                }
                if (task.isOverduePenaltyApplied()) {
                    mPenalizedCount++;
                }
            }

            double mOnTimeRate = mTotalAssigned == 0 ? 0 : (double) mCompletedOnTime / mTotalAssigned * 100.0;
            
            String riskLevel;
            if (mPenalizedCount > 0 || mOverdueCount > 3) {
                riskLevel = "RED";
                redMembers++;
            } else if (mOverdueCount > 0) {
                riskLevel = "YELLOW";
            } else {
                riskLevel = "GREEN";
            }

            String aiComment = ""; // Không dùng đánh giá cá nhân theo yêu cầu mới

            memberSummaries.add(new SprintMemberSummary(
                    assignee.getId(),
                    assignee.getProfile() != null && assignee.getProfile().getFullName() != null 
                            ? assignee.getProfile().getFullName() : assignee.getUsername(),
                    mTotalAssigned,
                    mCompletedOnTime,
                    mOverdueCount,
                    mPenalizedCount,
                    mOnTimeRate,
                    riskLevel,
                    aiComment
            ));
        }

        String aiSprintNarrative = geminiSprintNarrativeService.generateNarrative(
                sprint.getName(), sprint.getProject().getName(), totalTasks, completedTasks, completedOnTime,
                overdueTasks, penalizedTasks, tasksByAssignee.size(), redMembers);

        if (aiSprintNarrative == null) {
            aiSprintNarrative = String.format("Sprint %s đã kết thúc với tỷ lệ hoàn thành %.1f%%.", sprint.getName(), completionRateDouble);
        }

        String memberSummariesJson = "[]";
        try {
            memberSummariesJson = objectMapper.writeValueAsString(memberSummaries);
        } catch (Exception e) {
            log.error("Failed to serialize memberSummaries", e);
        }

        SprintCompletionSummary summary = SprintCompletionSummary.builder()
                .sprint(sprint)
                .projectId(sprint.getProject().getId())
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .completedOnTime(completedOnTime)
                .overdueTasks(overdueTasks)
                .penalizedTasks(penalizedTasks)
                .completionRate(completionRate)
                .onTimeRate(onTimeRate)
                .aiSprintNarrative(aiSprintNarrative)
                .memberSummariesJson(memberSummariesJson)
                .generatedAt(LocalDateTime.now())
                .generatedBy(triggeredBy)
                .build();

        sprintCompletionSummaryRepository.save(summary);
        
        log.info("SprintCompletionSummary generated for sprint {}: {}/{} tasks done", sprintId, completedTasks, totalTasks);

        String notifTitle = String.format("Sprint %s đã kết thúc", sprint.getName());
        String notifMessage = String.format("%d/%d task hoàn thành (%.1f%%)", completedTasks, totalTasks, completionRateDouble);
        
        List<ProjectMember> leaderMentors = new ArrayList<>();
        leaderMentors.addAll(projectMemberRepository.findByProjectIdAndRoleName(sprint.getProject().getId(), "LEADER"));
        leaderMentors.addAll(projectMemberRepository.findByProjectIdAndRoleName(sprint.getProject().getId(), "MENTOR"));
        
        for (ProjectMember pm : leaderMentors) {
            if (pm.getUser() != null) {
                notificationService.createAndPush(pm.getUser(), sprint.getProject(), NotificationEntityType.PROJECT, sprint.getId(), NotificationType.SYSTEM, notifTitle, notifMessage);
            }
        }

        if (redMembers > 0) {
            String emailSubject = String.format("DevTrack — Tổng kết Sprint %s · %s", sprint.getName(), sprint.getProject().getName());
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append("<h3>Tổng kết Sprint ").append(sprint.getName()).append("</h3>");
            emailBody.append("<p>").append(aiSprintNarrative).append("</p>");
            emailBody.append("<table border='1' cellpadding='5' style='border-collapse: collapse;'>");
            emailBody.append("<tr><th>Thành viên</th><th>Được giao</th><th>Đúng hạn</th><th>Trễ hạn</th><th>Penalty</th><th>Đánh giá</th><th>Nhận xét</th></tr>");
            
            for (SprintMemberSummary ms : memberSummaries) {
                emailBody.append("<tr>")
                        .append("<td>").append(ms.name()).append("</td>")
                        .append("<td>").append(ms.totalAssigned()).append("</td>")
                        .append("<td>").append(ms.completedOnTime()).append("</td>")
                        .append("<td>").append(ms.overdueCount()).append("</td>")
                        .append("<td>").append(ms.penalizedCount()).append("</td>")
                        .append("<td>").append(ms.riskLevel()).append("</td>")
                        .append("<td>").append(ms.aiComment()).append("</td>")
                        .append("</tr>");
            }
            emailBody.append("</table>");
            
            for (ProjectMember pm : leaderMentors) {
                if (pm.getUser() != null && isDeliverableEmail(pm.getUser().getEmail())) {
                    emailService.sendEmail(pm.getUser().getEmail(), emailSubject, emailBody.toString());
                }
            }
        }
    }

    private boolean isDeliverableEmail(String email) {
        if (email == null || email.isBlank()) return false;
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        return normalized.contains("@")
                && !normalized.endsWith(".test")
                && !normalized.endsWith("@example.com")
                && !normalized.endsWith("@localhost")
                && !normalized.endsWith(".local");
    }

    public SprintCompletionSummaryResponse getSummary(Long projectId, Long sprintId, Long userId) {
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new CustomException("Bạn không phải thành viên của project này", HttpStatus.FORBIDDEN);
        }
        SprintCompletionSummary summary = sprintCompletionSummaryRepository.findBySprintId(sprintId)
                .orElseThrow(() -> new CustomException("Tổng kết sprint chưa sẵn sàng. Sprint có thể chưa kết thúc.", HttpStatus.NOT_FOUND));

        List<SprintMemberSummary> memberSummaries = new ArrayList<>();
        try {
            if (summary.getMemberSummariesJson() != null && !summary.getMemberSummariesJson().isBlank() && !summary.getMemberSummariesJson().equals("[]")) {
                memberSummaries = objectMapper.readValue(summary.getMemberSummariesJson(),
                        new com.fasterxml.jackson.core.type.TypeReference<List<SprintMemberSummary>>() {});
            }
        } catch (Exception e) {
            log.error("Failed to parse member summaries JSON", e);
        }

        return SprintCompletionSummaryResponse.builder()
                .id(summary.getId())
                .sprintId(summary.getSprint().getId())
                .projectId(summary.getProjectId())
                .totalTasks(summary.getTotalTasks())
                .completedTasks(summary.getCompletedTasks())
                .completedOnTime(summary.getCompletedOnTime())
                .overdueTasks(summary.getOverdueTasks())
                .penalizedTasks(summary.getPenalizedTasks())
                .completionRate(summary.getCompletionRate())
                .onTimeRate(summary.getOnTimeRate())
                .aiSprintNarrative(summary.getAiSprintNarrative())
                .memberSummaries(memberSummaries)
                .generatedAt(summary.getGeneratedAt())
                .generatedBy(summary.getGeneratedBy())
                .build();
    }
}
