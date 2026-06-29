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
import org.springframework.transaction.annotation.Transactional;

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
    private final WebSocketBroadcastService webSocketBroadcastService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void deleteForSprint(Long sprintId) {
        sprintCompletionSummaryRepository.findBySprintId(sprintId)
                .ifPresent(sprintCompletionSummaryRepository::delete);
    }

    @Async("monitoringExecutor")
    @Transactional
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
            int mCompletedCount = 0;
            int mCompletedOnTime = 0;
            int mOverdueCount = 0;
            int mPenalizedCount = 0;
            double mTotalWeight = 0;
            double mTotalEstimatedHours = 0;
            long mDaysEarlySum = 0;
            int mDaysEarlyCount = 0;
            int mHighPriorityCount = 0;

            for (Task task : userTasks) {
                if (task.getStatus() == TaskStatus.DONE) {
                    mCompletedCount++;
                    if (task.getWeight() != null) mTotalWeight += task.getWeight().doubleValue();
                    if (task.getEstimatedHours() != null) mTotalEstimatedHours += task.getEstimatedHours().doubleValue();
                    if (task.getCompletedAt() != null && task.getDeadline() != null) {
                        long daysEarly = task.getDeadline().toEpochDay() - task.getCompletedAt().toLocalDate().toEpochDay();
                        mDaysEarlySum += daysEarly;
                        mDaysEarlyCount++;
                        if (daysEarly >= 0) mCompletedOnTime++;
                    }
                } else {
                    if (task.getDeadline() != null && task.getDeadline().isBefore(today)) {
                        mOverdueCount++;
                    }
                }
                if (task.isOverduePenaltyApplied()) {
                    mPenalizedCount++;
                }
                if (task.getPriority() == Priority.HIGH || task.getPriority() == Priority.CRITICAL) {
                    mHighPriorityCount++;
                }
            }
            double mAvgDaysEarly = mDaysEarlyCount == 0 ? 0.0 : (double) mDaysEarlySum / mDaysEarlyCount;

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

            String aiComment = geminiMemberNarrativeService.generateComment(
                    assignee.getProfile() != null && assignee.getProfile().getFullName() != null
                            ? assignee.getProfile().getFullName() : assignee.getUsername(),
                    mTotalAssigned, mCompletedCount, mCompletedOnTime, mOverdueCount, mPenalizedCount,
                    mTotalWeight, mTotalEstimatedHours, mAvgDaysEarly, mHighPriorityCount);
            if (aiComment == null) aiComment = "";

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
                sprint.getName(), sprint.getProject().getName(), sprint.getGoal(), totalTasks, completedTasks, completedOnTime,
                overdueTasks, penalizedTasks, tasksByAssignee.size(), redMembers, memberSummaries);
        log.info("Gemini narrative result: {}", aiSprintNarrative == null ? "NULL (fallback)" : "OK");

        if (aiSprintNarrative == null) {
            aiSprintNarrative = buildTemplateNarrative(sprint.getName(), sprint.getProject().getName(), sprint.getGoal(),
                    totalTasks, completedTasks, completedOnTime, overdueTasks, penalizedTasks,
                    tasksByAssignee.size(), redMembers, memberSummaries);
            log.info("Using template narrative, length: {}", aiSprintNarrative.length());
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
        webSocketBroadcastService.broadcastSprintAiDone(sprint.getProject().getId(), sprintId);
        log.info("SprintCompletionSummary generated for sprint {}: {}/{} tasks done", sprintId, completedTasks, totalTasks);

        boolean isUserTriggered = triggeredBy != null && triggeredBy.startsWith("USER_");

        if (!isUserTriggered) {
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
        }

        List<ProjectMember> leaderMentors = new ArrayList<>();
        leaderMentors.addAll(projectMemberRepository.findByProjectIdAndRoleName(sprint.getProject().getId(), "LEADER"));
        leaderMentors.addAll(projectMemberRepository.findByProjectIdAndRoleName(sprint.getProject().getId(), "MENTOR"));

        if (!isUserTriggered && redMembers > 0) {
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

    private String buildTemplateNarrative(String sprintName, String projectName, String sprintGoal,
            int totalTasks, int completedTasks, int completedOnTime, int overdueTasks, int penalizedTasks,
            int totalMembers, int redMembers, List<SprintMemberSummary> memberSummaries) {

        double completionRate = totalTasks == 0 ? 0 : (double) completedTasks / totalTasks * 100;
        double onTimeRate = totalTasks == 0 ? 0 : (double) completedOnTime / totalTasks * 100;

        List<String> redNames = memberSummaries.stream()
                .filter(m -> "RED".equals(m.riskLevel())).map(SprintMemberSummary::name).collect(Collectors.toList());
        List<String> greenNames = memberSummaries.stream()
                .filter(m -> "GREEN".equals(m.riskLevel())).map(SprintMemberSummary::name).collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();

        // Goal + Delivery (1 câu)
        if (sprintGoal != null && !sprintGoal.isBlank()) {
            sb.append("Mục tiêu **\"").append(sprintGoal).append("\"** ");
            sb.append(completionRate >= 80 ? "đạt được" : "chưa đạt");
        } else {
            sb.append("Sprint không có goal cụ thể");
        }
        sb.append(" — **").append(completedTasks).append("/").append(totalTasks)
          .append(" tasks** hoàn thành (").append(String.format("%.0f%%", completionRate)).append(")");
        sb.append(", đúng hạn **").append(completedOnTime).append("** (").append(String.format("%.0f%%", onTimeRate)).append("). ");

        // Quality (1 câu)
        if (overdueTasks == 0 && penalizedTasks == 0) {
            sb.append("Không có task trễ hay penalty — chất lượng sprint tốt. ");
        } else {
            sb.append("**").append(overdueTasks).append(" task trễ hạn**");
            if (penalizedTasks > 0) sb.append(", **").append(penalizedTasks).append(" bị penalty**");
            sb.append(". ");
        }

        // Team Performance (1 câu, nêu tên cụ thể)
        if (redMembers == 0) {
            if (!greenNames.isEmpty()) sb.append(String.join(", ", greenNames)).append(" duy trì GREEN toàn sprint. ");
        } else {
            sb.append(String.join(", ", redNames)).append(" ở mức **RED**");
            if (!greenNames.isEmpty()) sb.append("; ").append(String.join(", ", greenNames)).append(" GREEN");
            sb.append(". ");
        }

        // Process + Improvement (1 câu kết)
        if (!redNames.isEmpty() && penalizedTasks > 0) {
            sb.append("Sprint sau nên raise flag sớm khi có nguy cơ trễ và 1:1 với ").append(String.join(", ", redNames)).append(" để unblock kịp thời.");
        } else if (overdueTasks > 0) {
            sb.append("Sprint sau cần mid-sprint check để phát hiện task trễ sớm hơn.");
        } else {
            sb.append("Giữ vững quy trình hiện tại và tiếp tục duy trì chất lượng này cho sprint sau.");
        }

        return sb.toString().trim();
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
                .criteriaJson(summary.getCriteriaJson())
                .memberSummaries(memberSummaries)
                .generatedAt(summary.getGeneratedAt())
                .generatedBy(summary.getGeneratedBy())
                .build();
    }
}
