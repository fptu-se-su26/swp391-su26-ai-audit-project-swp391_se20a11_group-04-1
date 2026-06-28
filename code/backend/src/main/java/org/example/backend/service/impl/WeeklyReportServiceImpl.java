package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.WeeklyReportResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.WeeklyReportRepository;
import org.example.backend.service.EmailService;
import org.example.backend.service.NotificationService;
import org.example.backend.service.WeeklyReportService;
import org.example.backend.service.event.OutboxEventService;
import org.example.backend.service.sla.TaskSlaCategory;
import org.example.backend.service.sla.TaskSlaEvaluation;
import org.example.backend.service.sla.TaskSlaRuleService;
import org.example.backend.service.sla.SlaRiskAssessmentService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.example.backend.dto.WeeklyReportResponse.DecisionPack;
import org.example.backend.dto.WeeklyReportResponse.MemberDecision;
import org.example.backend.dto.WeeklyReportResponse.RiskTaskDecision;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class WeeklyReportServiceImpl implements WeeklyReportService {

    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final WeeklyReportRepository weeklyReportRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final OutboxEventService outboxEventService;
    private final TaskSlaRuleService taskSlaRuleService;
    private final SlaRiskAssessmentService slaRiskAssessmentService;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<WeeklyReportResponse> getProjectReports(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);
        return weeklyReportRepository.findByProjectIdOrderByReportWeekStartDesc(projectId).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WeeklyReportResponse> getSprintReports(Long projectId, Long sprintId, Long userId) {
        ensureProjectMember(projectId, userId);
        findSprint(projectId, sprintId);
        return weeklyReportRepository.findByProjectIdAndSprintIdOrderByGeneratedAtDesc(projectId, sprintId).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WeeklyReportResponse getProjectReport(Long projectId, Long reportId, Long userId) {
        ensureProjectMember(projectId, userId);
        WeeklyReport report = weeklyReportRepository.findWithMembersById(reportId)
                .filter(item -> item.getProject() != null && projectId.equals(item.getProject().getId()))
                .orElseThrow(() -> new CustomException("Weekly report not found", HttpStatus.NOT_FOUND));
        
        WeeklyReportResponse response = toResponse(report);
        if (!isLeaderOrMentor(projectId, userId)) {
            filterReportForMember(response, userId);
        }
        return response;
    }

    private boolean isLeaderOrMentor(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(m -> m.getRole() != null && canGenerateReport(m.getRole().getName()))
                .orElse(false);
    }

    private void filterReportForMember(WeeklyReportResponse response, Long userId) {
        if (response.getMembers() != null) {
            List<WeeklyReportResponse.MemberRisk> filteredMembers = response.getMembers().stream()
                    .filter(m -> userId.equals(m.getUserId()))
                    .toList();
            response.setMembers(filteredMembers);
        }
        if (response.getDecisionPack() != null) {
            if (response.getDecisionPack().getRiskTasks() != null) {
                List<WeeklyReportResponse.RiskTaskDecision> filteredTasks = response.getDecisionPack().getRiskTasks().stream()
                        .filter(t -> userId.equals(t.getAssigneeId()))
                        .toList();
                response.getDecisionPack().setRiskTasks(filteredTasks);
            }
            if (response.getDecisionPack().getMemberDecisions() != null) {
                List<WeeklyReportResponse.MemberDecision> filteredMemberDecisions = response.getDecisionPack().getMemberDecisions().stream()
                        .filter(m -> userId.equals(m.getUserId()))
                        .toList();
                response.getDecisionPack().setMemberDecisions(filteredMemberDecisions);
            }
        }
    }

    @Override
    public WeeklyReportResponse generateProjectReport(Long projectId, Long userId) {
        ensureLeaderOrMentor(projectId, userId);
        Sprint sprint = sprintRepository.findFirstByProjectIdAndStatus(projectId, SprintStatus.ACTIVE)
                .orElseThrow(() -> new CustomException("No active sprint found for this project", HttpStatus.BAD_REQUEST));
        WeeklyReport report = generateForSprint(sprint.getProject(), sprint, "USER_" + userId, ExistingReportPolicy.REPLACE_EXISTING);
        return toResponse(report);
    }

    @Override
    public WeeklyReportResponse generateSprintReport(Long projectId, Long sprintId, Long userId) {
        ensureLeaderOrMentor(projectId, userId);
        Sprint sprint = findSprint(projectId, sprintId);
        WeeklyReport report = generateForSprint(sprint.getProject(), sprint, "USER_" + userId, ExistingReportPolicy.REPLACE_EXISTING);
        return toResponse(report);
    }

    @Override
    public int generateWeeklyReportsForAllProjects() {
        int created = 0;
        for (Project project : projectRepository.findAll()) {
            WeeklyReport report = sprintRepository.findFirstByProjectIdAndStatus(project.getId(), SprintStatus.ACTIVE)
                    .map(sprint -> generateForSprint(project, sprint, "SYSTEM", ExistingReportPolicy.SKIP_EXISTING))
                    .orElse(null);
            if (report != null) created++;
        }
        return created;
    }

    private WeeklyReport generateForSprint(Project project, Sprint sprint, String generatedBy, ExistingReportPolicy existingReportPolicy) {
        if (existingReportPolicy == ExistingReportPolicy.SKIP_EXISTING
                && weeklyReportRepository.existsByProjectIdAndSprintId(project.getId(), sprint.getId())) {
            return null;
        }

        if (existingReportPolicy == ExistingReportPolicy.REPLACE_EXISTING) {
            List<WeeklyReport> existingReports = weeklyReportRepository
                    .findByProjectIdAndSprintId(project.getId(), sprint.getId());
            if (!existingReports.isEmpty()) {
                weeklyReportRepository.deleteAll(existingReports);
                weeklyReportRepository.flush();
            }
        }

        List<Task> sprintTasks = taskRepository.findByProjectIdAndSprintIdOrderBySprintPlanDateAscUpdatedAtDesc(project.getId(), sprint.getId());
        Map<UserAccount, List<Task>> tasksByAssignee = sprintTasks.stream()
                .filter(task -> task.getPrimaryAssignee() != null)
                .collect(Collectors.groupingBy(Task::getPrimaryAssignee));

        WeeklyReport report = WeeklyReport.builder()
                .project(project)
                .sprint(sprint)
                .reportWeekStart(sprint.getStartDate())
                .reportWeekEnd(sprint.getEndDate())
                .generatedBy(generatedBy)
                .build();

        LocalDate today = LocalDate.now(clock);
        LocalDateTime staleThreshold = LocalDateTime.now(clock).minusDays(3);
        for (Map.Entry<UserAccount, List<Task>> entry : tasksByAssignee.entrySet()) {
            WeeklyReportMember member = evaluateMember(entry.getKey(), entry.getValue(), today, staleThreshold);
            if (member != null) {
                report.addMember(member);
            }
        }

        report.setSummary(buildSummary(project, sprint, report));
        WeeklyReport saved = weeklyReportRepository.save(report);
        outboxEventService.createEvent("SPRINT_REPORT_GENERATED", "WeeklyReport", saved.getId(), Map.of(
                "reportId", saved.getId(),
                "projectId", project.getId(),
                "sprintId", sprint.getId(),
                "redMemberCount", saved.getRedMemberCount(),
                "startDate", sprint.getStartDate().toString(),
                "endDate", sprint.getEndDate().toString()
        ));
        sendWebNotificationsToOversight(saved);
        sendSummaryEmailToOversight(saved);
        return saved;
    }

    private enum ExistingReportPolicy {
        REPLACE_EXISTING,
        SKIP_EXISTING
    }

    private void sendWebNotificationsToOversight(WeeklyReport report) {
        List<ProjectMember> recipients = reportRecipients(report);
        String sprintName = report.getSprint() != null ? report.getSprint().getName() : "Sprint";
        String title = report.getRedMemberCount() > 0
                ? "Sprint report có SLA risk"
                : "Sprint report đã được tạo";
        String message = report.getRedMemberCount() > 0
                ? sprintName + " có " + report.getRedMemberCount() + " member đỏ, "
                + report.getTotalOverdueTasks() + " task quá hạn, "
                + report.getTotalPenalizedTasks() + " penalty."
                : sprintName + " đã được generate và hiện không có member đỏ.";

        for (ProjectMember recipient : recipients) {
            notificationService.createAndPush(
                    recipient.getUser(),
                    report.getProject(),
                    NotificationEntityType.WEEKLY_REPORT,
                    report.getId(),
                    NotificationType.SYSTEM,
                    "Sprint report generated",
                    "A sprint report was generated for " + sprintName + ". Click to view the report result."
            );
        }
    }

    private WeeklyReportMember evaluateMember(UserAccount user, List<Task> tasks, LocalDate today, LocalDateTime staleThreshold) {
        int overdue = 0;
        int penalized = 0;
        int stale = 0;

        for (Task task : tasks) {
            TaskSlaEvaluation evaluation = taskSlaRuleService.evaluate(task);
            boolean taskPenalized = evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)
                    || task.isOverduePenaltyApplied();

            if (taskPenalized) {
                penalized++;
            }

            if (task.getDeadline() != null && task.getStatus() != TaskStatus.DONE && today.isAfter(task.getDeadline())) {
                overdue++;
                if (task.getUpdatedAt() != null && task.getUpdatedAt().isBefore(staleThreshold)) {
                    stale++;
                }
            }
        }

        int totalAssigned = tasks.size();
        int completedOnTime = (int) tasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE
                        && t.getCompletedAt() != null
                        && t.getDeadline() != null
                        && !t.getCompletedAt().toLocalDate().isAfter(t.getDeadline()))
                .count();

        boolean red = overdue > 3 || penalized > 0 || stale > 0;
        if (!red) {
            return null;
        }

        List<String> reasons = new ArrayList<>();
        if (overdue > 3) reasons.add("more than 3 overdue tasks");
        if (penalized > 0) reasons.add(penalized + " penalized task(s)");
        if (stale > 0) reasons.add(stale + " overdue task(s) without update for 3+ days");

        return WeeklyReportMember.builder()
                .user(user)
                .overdueTaskCount(overdue)
                .frozenTaskCount(0)
                .penalizedTaskCount(penalized)
                .staleExplanationCount(stale)
                .totalAssignedCount(totalAssigned)
                .completedOnTimeCount(completedOnTime)
                .riskLevel("RED")
                .reason(String.join("; ", reasons))
                .build();
    }

    private void sendSummaryEmailToOversight(WeeklyReport report) {
        if (report.getRedMemberCount() == 0) {
            return;
        }
        List<ProjectMember> recipients = reportRecipients(report);

        String sprintName = report.getSprint() != null ? report.getSprint().getName() : "Sprint";
        String subject = "DevTrack Sprint Report - " + sprintName + " - " + report.getProject().getName();
        String body = buildSprintReportEmail(report, sprintName);
        for (ProjectMember recipient : recipients) {
            String email = recipient.getUser().getEmail();
            if (isDeliverableEmail(email)) {
                emailService.sendEmail(email, subject, body);
            } else {
                log.info("Skipping sprint report email for non-deliverable address: {}", email);
            }
        }
    }

    private List<ProjectMember> reportRecipients(WeeklyReport report) {
        List<ProjectMember> recipients = new ArrayList<>();
        recipients.addAll(projectMemberRepository.findByProjectIdAndRoleName(report.getProject().getId(), "LEADER"));
        recipients.addAll(projectMemberRepository.findByProjectIdAndRoleName(report.getProject().getId(), "PROJECT_LEADER"));
        recipients.addAll(projectMemberRepository.findByProjectIdAndRoleName(report.getProject().getId(), "MENTOR"));
        return recipients.stream()
                .filter(member -> member.getUser() != null)
                .collect(Collectors.toMap(
                        member -> member.getUser().getId(),
                        member -> member,
                        (first, ignored) -> first
                ))
                .values()
                .stream()
                .toList();
    }

    private String buildSprintReportEmail(WeeklyReport report, String sprintName) {
        String projectName = report.getProject() != null ? report.getProject().getName() : "Project";
        String period = report.getReportWeekStart() + " - " + report.getReportWeekEnd();
        String memberCards = report.getMembers().stream()
                .map(member -> {
                    String name = member.getUser() != null ? member.getUser().getUsername() : "Unassigned";
                    return """
                            <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:0 0 12px;background:#ffffff;">
                              <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:10px;">%s</div>
                              <div style="display:table;width:100%%;table-layout:fixed;margin-bottom:10px;">
                                <div style="display:table-cell;padding-right:6px;">
                                  <div style="background:#fef3c7;border-radius:10px;padding:10px;text-align:center;">
                                    <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;">Overdue</div>
                                    <div style="font-size:22px;font-weight:800;color:#92400e;">%d</div>
                                  </div>
                                </div>
                                <div style="display:table-cell;padding-left:6px;">
                                  <div style="background:#fee2e2;border-radius:10px;padding:10px;text-align:center;">
                                    <div style="font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;">Penalty</div>
                                    <div style="font-size:22px;font-weight:800;color:#991b1b;">%d</div>
                                  </div>
                                </div>
                              </div>
                              <div style="font-size:13px;line-height:1.55;color:#4b5563;word-break:break-word;">
                                <strong style="color:#374151;">Reason:</strong> %s
                              </div>
                            </div>
                            """.formatted(
                            escape(name),
                            member.getOverdueTaskCount(),
                            member.getPenalizedTaskCount(),
                            escape(member.getReason())
                    );
                })
                .collect(Collectors.joining());

        return """
                <!doctype html>
                <html>
                  <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
                    <div style="max-width:720px;margin:0 auto;padding:28px 14px;">
                      <div style="background:#0f4da8;border-radius:18px 18px 0 0;padding:26px 28px;color:#ffffff;">
                        <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.86;">DevTrack Sprint Report</div>
                        <h1 style="margin:10px 0 4px;font-size:26px;line-height:1.25;">%s</h1>
                        <div style="font-size:14px;opacity:.9;">%s · %s</div>
                      </div>
                      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 18px 18px;overflow:hidden;">
                        <div style="padding:22px 28px;">
                          <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#374151;">%s</p>
                          <div style="display:table;width:100%%;table-layout:fixed;border-spacing:0 0;">
                            %s
                            %s
                            %s
                          </div>
                        </div>
                        <div style="padding:0 28px 26px;">
                          <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Members cần chú ý</h2>
                          %s
                        </div>
                        <div style="background:#f9fafb;padding:16px 28px;color:#6b7280;font-size:12px;">
                          Mail này được tạo tự động khi Leader/Mentor generate sprint report trong DevTrack.
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
                """.formatted(
                escape(sprintName),
                escape(projectName),
                escape(period),
                escape(report.getSummary()),
                metricCard("Red members", report.getRedMemberCount(), "#fee2e2", "#991b1b"),
                metricCard("Overdue tasks", report.getTotalOverdueTasks(), "#fef3c7", "#92400e"),
                metricCard("Penalized tasks", report.getTotalPenalizedTasks(), "#ede9fe", "#5b21b6"),
                memberCards
        );
    }

    private String metricCard(String label, int value, String background, String color) {
        return """
                <div style="display:table-cell;width:33.33%%;padding:0 8px 14px 0;">
                  <div style="background:%s;border-radius:12px;padding:16px 14px;">
                    <div style="font-size:12px;font-weight:700;color:%s;text-transform:uppercase;">%s</div>
                    <div style="font-size:28px;font-weight:800;color:%s;margin-top:4px;">%d</div>
                  </div>
                </div>
                """.formatted(background, color, escape(label), color, value);
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

    private String buildSummary(Project project, Sprint sprint, WeeklyReport report) {
        return buildSummaryText(
                project,
                sprint,
                report.getRedMemberCount(),
                report.getTotalOverdueTasks(),
                report.getTotalPenalizedTasks()
        );
    }

    private String buildSummaryText(Project project, Sprint sprint, int redMembers, int overdueTasks, int penalizedTasks) {
        if (redMembers == 0) {
            return "Sprint " + sprint.getName() + " in project " + project.getName()
                    + " has no red-alert members.";
        }
        return "Sprint " + sprint.getName() + " in project " + project.getName()
                + " has " + redMembers
                + " red-alert member(s), " + overdueTasks
                + " overdue task(s), and " + penalizedTasks + " penalized task(s).";
    }

    private Project findProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
    }

    private Sprint findSprint(Long projectId, Long sprintId) {
        return sprintRepository.findByIdAndProjectId(sprintId, projectId)
                .orElseThrow(() -> new CustomException("Sprint not found", HttpStatus.NOT_FOUND));
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN);
        }
    }

    private void ensureLeaderOrMentor(Long projectId, Long userId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));
        String roleName = member.getRole() != null ? member.getRole().getName() : "";
        if (!canGenerateReport(roleName)) {
            throw new CustomException("Only Leader/Mentor can generate reports", HttpStatus.FORBIDDEN);
        }
    }

    private boolean canGenerateReport(String roleName) {
        String normalized = roleName == null
                ? ""
                : roleName.trim().toUpperCase(Locale.ROOT).replace(" ", "_");
        return normalized.contains("LEADER")
                || "MENTOR".equals(normalized);
    }

    private WeeklyReportResponse toSummaryResponse(WeeklyReport report) {
        List<WeeklyReportMember> liveMembers = liveMemberRisks(report);
        boolean hasLiveSprintData = liveMembers != null;
        int redMembers = hasLiveSprintData ? liveMembers.size() : report.getRedMemberCount();
        int overdueTasks = hasLiveSprintData
                ? liveMembers.stream().mapToInt(WeeklyReportMember::getOverdueTaskCount).sum()
                : report.getTotalOverdueTasks();
        int penalizedTasks = hasLiveSprintData
                ? liveMembers.stream().mapToInt(WeeklyReportMember::getPenalizedTaskCount).sum()
                : report.getTotalPenalizedTasks();
        String summary = hasLiveSprintData
                ? buildSummaryText(report.getProject(), report.getSprint(), redMembers, overdueTasks, penalizedTasks)
                : report.getSummary();

        return WeeklyReportResponse.builder()
                .id(report.getId())
                .projectId(report.getProject() != null ? report.getProject().getId() : null)
                .projectName(report.getProject() != null ? report.getProject().getName() : null)
                .sprintId(report.getSprint() != null ? report.getSprint().getId() : null)
                .sprintName(report.getSprint() != null ? report.getSprint().getName() : null)
                .reportWeekStart(report.getReportWeekStart())
                .reportWeekEnd(report.getReportWeekEnd())
                .status(report.getStatus())
                .redMemberCount(redMembers)
                .totalOverdueTasks(overdueTasks)
                .totalPenalizedTasks(penalizedTasks)
                .summary(summary)
                .generatedAt(report.getGeneratedAt())
                .generatedBy(report.getGeneratedBy())
                .members(List.of())
                .build();
    }

    private WeeklyReportResponse toResponse(WeeklyReport report) {
        WeeklyReportResponse response = toSummaryResponse(report);
        List<WeeklyReportMember> liveMembers = liveMemberRisks(report);
        response.setMembers((liveMembers != null ? liveMembers : report.getMembers()).stream().map(this::toMemberRisk).toList());
        response.setDecisionPack(buildDecisionPack(report));
        return response;
    }

    private DecisionPack buildDecisionPack(WeeklyReport report) {
        if (report.getProject() == null || report.getSprint() == null) {
            return null;
        }

        List<Task> sprintTasks = taskRepository.findByProjectIdAndSprintIdOrderBySprintPlanDateAscUpdatedAtDesc(
                report.getProject().getId(),
                report.getSprint().getId()
        );

        int countPenalty = 0;
        int countBlocked = 0;
        int countOverdueShort = 0;
        int countDueSoon = 0;

        List<RiskTaskDecision> riskTasks = new ArrayList<>();

        for (Task task : sprintTasks) {
            TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
            boolean isRisk = false;
            
            SlaRiskAssessmentService.AssessmentResult assessment = slaRiskAssessmentService.assess(task, eval);
            String riskLevel = assessment.getRiskLevel();
            List<String> reasons = assessment.getReasons();
            String recommendedAction = assessment.getRecommendedAction();
            
            boolean isPenalty = eval.categories().contains(TaskSlaCategory.OVERDUE_PENALTY) || task.isOverduePenaltyApplied();

            if (isPenalty) {
                countPenalty++;
                isRisk = true;
            } else if (eval.categories().contains(TaskSlaCategory.BLOCKED)) {
                countBlocked++;
                isRisk = true;
            } else if (eval.categories().contains(TaskSlaCategory.OVERDUE_SHORT)) {
                countOverdueShort++;
                isRisk = true;
            } else if (eval.categories().contains(TaskSlaCategory.DUE_SOON)) {
                countDueSoon++;
                isRisk = true;
            }

            if (isRisk) {
                UserAccount assignee = task.getPrimaryAssignee();
                String assigneeName = "Unassigned";
                if (assignee != null) {
                    assigneeName = (assignee.getProfile() != null && assignee.getProfile().getFullName() != null) 
                            ? assignee.getProfile().getFullName() 
                            : assignee.getUsername();
                }

                riskTasks.add(RiskTaskDecision.builder()
                        .taskId(task.getId())
                        .title(task.getTitle())
                        .assigneeId(assignee != null ? assignee.getId() : null)
                        .assigneeName(assigneeName)
                        .status(task.getStatus() != null ? task.getStatus().name() : null)
                        .priority(task.getPriority() != null ? task.getPriority().name() : null)
                        .deadline(task.getDeadline())
                        .requirementId(task.getRequirementId())
                        .requirementCode(null)
                        .slaCategories(eval.categories().stream().map(Enum::name).toList())
                        .overdueDays(eval.overdueDays())
                        .overduePenaltyApplied(isPenalty)
                        .riskLevel(riskLevel)
                        .reasons(reasons)
                        .recommendedAction(recommendedAction)
                        .build());
            }
        }

        int riskScore = 100 - (countPenalty * 15) - (countBlocked * 10) - (countOverdueShort * 6) - (countDueSoon * 3);
        if (riskScore < 0) riskScore = 0;
        if (riskScore > 100) riskScore = 100;

        String overallRiskLevel;
        if (countPenalty > 0 || riskScore < 40) {
            overallRiskLevel = "CRITICAL";
        } else if (riskScore < 65) {
            overallRiskLevel = "HIGH";
        } else if (riskScore < 85) {
            overallRiskLevel = "MEDIUM";
        } else if (!riskTasks.isEmpty() && riskScore >= 85) {
            overallRiskLevel = "LOW";
        } else {
            overallRiskLevel = "NORMAL";
        }

        List<String> mainReasons = new ArrayList<>();
        if (countPenalty > 0) mainReasons.add(countPenalty + " task(s) have overdue penalty");
        if (countBlocked > 0) mainReasons.add(countBlocked + " task(s) are blocked");
        if (countOverdueShort > 0) mainReasons.add(countOverdueShort + " task(s) are recently overdue");
        if (countDueSoon > 0) mainReasons.add(countDueSoon + " task(s) are due soon");

        List<String> recommendedActions = new ArrayList<>();
        if (countPenalty > 0) recommendedActions.add("Review penalized tasks first and decide whether to reassign or escalate.");
        if (countBlocked > 0) recommendedActions.add("Resolve blocked tasks in the next leader check-in.");
        if (countOverdueShort > 0) recommendedActions.add("Follow up recently overdue tasks before they become penalties.");
        if (countDueSoon > 0) recommendedActions.add("Remind assignees about tasks due within 24 hours.");

        Map<Long, List<RiskTaskDecision>> memberTaskMap = new HashMap<>();
        Map<Long, UserAccount> userMap = new HashMap<>();
        for (Task task : sprintTasks) {
            UserAccount assignee = task.getPrimaryAssignee();
            if (assignee != null) {
                userMap.put(assignee.getId(), assignee);
            }
        }
        for (RiskTaskDecision rt : riskTasks) {
            if (rt.getAssigneeId() != null) {
                memberTaskMap.computeIfAbsent(rt.getAssigneeId(), k -> new ArrayList<>()).add(rt);
            }
        }

        List<MemberDecision> memberDecisions = new ArrayList<>();
        for (Map.Entry<Long, List<RiskTaskDecision>> entry : memberTaskMap.entrySet()) {
            Long userId = entry.getKey();
            List<RiskTaskDecision> mTasks = entry.getValue();
            UserAccount user = userMap.get(userId);
            
            int penalizedTaskCount = (int) mTasks.stream().filter(t -> t.getOverduePenaltyApplied() != null && t.getOverduePenaltyApplied()).count();
            int overdueTaskCount = (int) mTasks.stream().filter(t -> t.getOverdueDays() != null && t.getOverdueDays() > 0).count();
            
            String mRiskLevel = "NORMAL";
            String mRecommendedAction = "";
            List<String> mReasons = new ArrayList<>();
            
            if (mTasks.stream().anyMatch(t -> "CRITICAL".equals(t.getRiskLevel()))) {
                mRiskLevel = "CRITICAL";
                mRecommendedAction = "Escalate with this member directly regarding penalized tasks.";
                mReasons.add("Member has penalized task(s).");
            } else if (mTasks.stream().anyMatch(t -> "HIGH".equals(t.getRiskLevel()))) {
                mRiskLevel = "HIGH";
                mRecommendedAction = "Help this member resolve blocked tasks or missing evidence.";
                mReasons.add("Member has blocked task(s) or missing evidence.");
            } else if (mTasks.stream().anyMatch(t -> "MEDIUM".equals(t.getRiskLevel()))) {
                mRiskLevel = "MEDIUM";
                mRecommendedAction = "Monitor this member's progress closely to avoid penalty.";
                mReasons.add("Member has recently overdue task(s).");
            } else if (mTasks.stream().anyMatch(t -> "LOW".equals(t.getRiskLevel()))) {
                mRiskLevel = "LOW";
                mRecommendedAction = "Remind member of upcoming deadlines.";
                mReasons.add("Member has task(s) due soon.");
            }
            
            String name = "";
            String email = "";
            if (user != null) {
                name = (user.getProfile() != null && user.getProfile().getFullName() != null) ? user.getProfile().getFullName() : user.getUsername();
                email = user.getEmail();
            }
            
            memberDecisions.add(MemberDecision.builder()
                    .userId(userId)
                    .name(name)
                    .email(email)
                    .riskLevel(mRiskLevel)
                    .riskTaskCount(mTasks.size())
                    .overdueTaskCount(overdueTaskCount)
                    .penalizedTaskCount(penalizedTaskCount)
                    .reasons(mReasons)
                    .recommendedAction(mRecommendedAction)
                    .build());
        }

        return DecisionPack.builder()
                .overallRiskLevel(overallRiskLevel)
                .riskScore(riskScore)
                .mainReasons(mainReasons)
                .recommendedActions(recommendedActions)
                .riskTasks(riskTasks)
                .memberDecisions(memberDecisions)
                .build();
    }

    private List<WeeklyReportMember> liveMemberRisks(WeeklyReport report) {
        if (report.getProject() == null || report.getSprint() == null) {
            return null;
        }

        List<Task> sprintTasks = taskRepository.findByProjectIdAndSprintIdOrderBySprintPlanDateAscUpdatedAtDesc(
                report.getProject().getId(),
                report.getSprint().getId()
        );
        Map<UserAccount, List<Task>> tasksByAssignee = sprintTasks.stream()
                .filter(task -> task.getPrimaryAssignee() != null)
                .collect(Collectors.groupingBy(Task::getPrimaryAssignee));
        LocalDate today = LocalDate.now(clock);
        LocalDateTime staleThreshold = LocalDateTime.now(clock).minusDays(3);

        return tasksByAssignee.entrySet().stream()
                .map(entry -> evaluateMember(entry.getKey(), entry.getValue(), today, staleThreshold))
                .filter(member -> member != null)
                .toList();
    }

    private WeeklyReportResponse.MemberRisk toMemberRisk(WeeklyReportMember member) {
        UserAccount user = member.getUser();
        String name = user.getProfile() != null && user.getProfile().getFullName() != null
                ? user.getProfile().getFullName()
                : user.getUsername();
        return WeeklyReportResponse.MemberRisk.builder()
                .userId(user.getId())
                .name(name)
                .email(user.getEmail())
                .overdueTaskCount(member.getOverdueTaskCount())
                .frozenTaskCount(member.getFrozenTaskCount())
                .penalizedTaskCount(member.getPenalizedTaskCount())
                .staleExplanationCount(member.getStaleExplanationCount())
                .riskLevel(member.getRiskLevel())
                .reason(member.getReason())
                .build();
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
