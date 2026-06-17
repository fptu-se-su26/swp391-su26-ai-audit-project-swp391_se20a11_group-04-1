package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.WeeklyReportResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.WeeklyReportRepository;
import org.example.backend.service.EmailService;
import org.example.backend.service.WeeklyReportService;
import org.example.backend.service.event.OutboxEventService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class WeeklyReportServiceImpl implements WeeklyReportService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final WeeklyReportRepository weeklyReportRepository;
    private final EmailService emailService;
    private final OutboxEventService outboxEventService;
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
    public WeeklyReportResponse getProjectReport(Long projectId, Long reportId, Long userId) {
        ensureProjectMember(projectId, userId);
        WeeklyReport report = weeklyReportRepository.findWithMembersById(reportId)
                .filter(item -> item.getProject() != null && projectId.equals(item.getProject().getId()))
                .orElseThrow(() -> new CustomException("Weekly report not found", HttpStatus.NOT_FOUND));
        return toResponse(report);
    }

    @Override
    public WeeklyReportResponse generateProjectReport(Long projectId, Long userId) {
        ensureLeaderOrMentor(projectId, userId);
        Project project = findProject(projectId);
        LocalDate weekEnd = LocalDate.now(clock).with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDate weekStart = weekEnd.minusDays(6);
        WeeklyReport report = generateForProject(project, weekStart, weekEnd, "USER_" + userId, true);
        return toResponse(report);
    }

    @Override
    public int generateWeeklyReportsForAllProjects() {
        LocalDate weekEnd = LocalDate.now(clock).with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));
        LocalDate weekStart = weekEnd.minusDays(6);
        int created = 0;
        for (Project project : projectRepository.findAll()) {
            WeeklyReport report = generateForProject(project, weekStart, weekEnd, "SYSTEM", false);
            if (report != null) {
                created++;
            }
        }
        return created;
    }

    private WeeklyReport generateForProject(Project project, LocalDate weekStart, LocalDate weekEnd,
                                            String generatedBy, boolean replaceExisting) {
        if (weeklyReportRepository.existsByProjectIdAndReportWeekStartAndReportWeekEnd(project.getId(), weekStart, weekEnd)
                && !replaceExisting) {
            return null;
        }

        weeklyReportRepository.findByProjectIdOrderByReportWeekStartDesc(project.getId()).stream()
                .filter(report -> report.getReportWeekStart().equals(weekStart) && report.getReportWeekEnd().equals(weekEnd))
                .findFirst()
                .ifPresent(weeklyReportRepository::delete);

        List<Task> projectTasks = taskRepository.findByProjectIdOrderByUpdatedAtDesc(project.getId());
        Map<UserAccount, List<Task>> tasksByAssignee = projectTasks.stream()
                .filter(task -> task.getPrimaryAssignee() != null)
                .collect(Collectors.groupingBy(Task::getPrimaryAssignee));

        WeeklyReport report = WeeklyReport.builder()
                .project(project)
                .reportWeekStart(weekStart)
                .reportWeekEnd(weekEnd)
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

        report.setSummary(buildSummary(project, report));
        WeeklyReport saved = weeklyReportRepository.save(report);
        outboxEventService.createEvent("WEEKLY_REPORT_GENERATED", "WeeklyReport", saved.getId(), Map.of(
                "reportId", saved.getId(),
                "projectId", project.getId(),
                "redMemberCount", saved.getRedMemberCount(),
                "weekStart", weekStart.toString(),
                "weekEnd", weekEnd.toString()
        ));
        sendSummaryEmailToOversight(saved);
        return saved;
    }

    private WeeklyReportMember evaluateMember(UserAccount user, List<Task> tasks, LocalDate today, LocalDateTime staleThreshold) {
        int overdue = 0;
        int frozen = 0;
        int penalized = 0;
        int stale = 0;

        for (Task task : tasks) {
            if (task.getStatus() == TaskStatus.DONE || task.getDeadline() == null) {
                if (task.isOverduePenaltyApplied()) {
                    penalized++;
                }
                continue;
            }
            if (today.isAfter(task.getDeadline())) {
                overdue++;
                long overdueDays = java.time.temporal.ChronoUnit.DAYS.between(task.getDeadline(), today);
                if (overdueDays >= 3) {
                    frozen++;
                }
                if (task.getUpdatedAt() != null && task.getUpdatedAt().isBefore(staleThreshold)) {
                    stale++;
                }
            }
            if (task.isOverduePenaltyApplied()) {
                penalized++;
            }
        }

        boolean red = overdue > 3 || frozen > 0 || penalized > 0 || stale > 0;
        if (!red) {
            return null;
        }

        List<String> reasons = new ArrayList<>();
        if (overdue > 3) reasons.add("more than 3 overdue tasks");
        if (frozen > 0) reasons.add(frozen + " task(s) overdue at least 3 days");
        if (penalized > 0) reasons.add(penalized + " penalized task(s)");
        if (stale > 0) reasons.add(stale + " overdue task(s) without update for 3+ days");

        return WeeklyReportMember.builder()
                .user(user)
                .overdueTaskCount(overdue)
                .frozenTaskCount(frozen)
                .penalizedTaskCount(penalized)
                .staleExplanationCount(stale)
                .riskLevel("RED")
                .reason(String.join("; ", reasons))
                .build();
    }

    private void sendSummaryEmailToOversight(WeeklyReport report) {
        if (report.getRedMemberCount() == 0) {
            return;
        }
        List<ProjectMember> recipients = new ArrayList<>();
        recipients.addAll(projectMemberRepository.findByProjectIdAndRoleName(report.getProject().getId(), "LEADER"));
        recipients.addAll(projectMemberRepository.findByProjectIdAndRoleName(report.getProject().getId(), "MENTOR"));

        String subject = "DevTrack Weekly Report - " + report.getProject().getName();
        String body = "<h2>Weekly Report</h2><p>" + escape(report.getSummary()) + "</p>";
        for (ProjectMember recipient : recipients) {
            emailService.sendEmail(recipient.getUser().getEmail(), subject, body);
        }
    }

    private String buildSummary(Project project, WeeklyReport report) {
        if (report.getRedMemberCount() == 0) {
            return "Project " + project.getName() + " has no red-alert members for this week.";
        }
        return "Project " + project.getName() + " has " + report.getRedMemberCount()
                + " red-alert member(s), " + report.getTotalOverdueTasks()
                + " overdue task(s), and " + report.getTotalPenalizedTasks() + " penalized task(s).";
    }

    private Project findProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
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
        if (!"LEADER".equalsIgnoreCase(roleName) && !"PROJECT_LEADER".equalsIgnoreCase(roleName)
                && !"MENTOR".equalsIgnoreCase(roleName)) {
            throw new CustomException("Only leaders or mentors can generate weekly reports", HttpStatus.FORBIDDEN);
        }
    }

    private WeeklyReportResponse toSummaryResponse(WeeklyReport report) {
        return WeeklyReportResponse.builder()
                .id(report.getId())
                .projectId(report.getProject() != null ? report.getProject().getId() : null)
                .projectName(report.getProject() != null ? report.getProject().getName() : null)
                .reportWeekStart(report.getReportWeekStart())
                .reportWeekEnd(report.getReportWeekEnd())
                .status(report.getStatus())
                .redMemberCount(report.getRedMemberCount())
                .totalOverdueTasks(report.getTotalOverdueTasks())
                .totalPenalizedTasks(report.getTotalPenalizedTasks())
                .summary(report.getSummary())
                .generatedAt(report.getGeneratedAt())
                .generatedBy(report.getGeneratedBy())
                .members(List.of())
                .build();
    }

    private WeeklyReportResponse toResponse(WeeklyReport report) {
        WeeklyReportResponse response = toSummaryResponse(report);
        response.setMembers(report.getMembers().stream().map(this::toMemberRisk).toList());
        return response;
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
