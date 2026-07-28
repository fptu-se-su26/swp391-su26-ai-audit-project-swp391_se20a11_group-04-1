package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.example.backend.entity.AuditLog;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectMember;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditEmailDigestScheduler {

    private final AuditLogRepository auditLogRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final EmailService emailService;

    // Regex kiểm tra email hợp lệ (có domain thật, không phải .test, .local, .invalid)
    private static final Pattern REAL_EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.(com|net|org|edu|gov|vn|io|co|info|biz|me|app)$",
        Pattern.CASE_INSENSITIVE
    );

    private boolean isRealEmail(String email) {
        return email != null && REAL_EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * Chạy mỗi ngày lúc 00:00 (12:00 AM - Nửa đêm).
     * Thu thập tất cả các log chưa được gửi mail (emailSent = false) và gom nhóm theo dự án.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @SchedulerLock(name = "sendAuditEmailDigestLock", lockAtLeastFor = "5m", lockAtMostFor = "15m")
    public void sendDailyAuditDigestEmail() {
        log.info("Starting Daily Audit Email Digest Job...");
        
        List<Long> projectIds = auditLogRepository.findDistinctProjectIdByEmailSentFalse();
        if (projectIds.isEmpty()) {
            log.info("No unsent audit logs found. Job finished.");
            return;
        }

        for (Long projectId : projectIds) {
            try {
                Project project = projectRepository.findById(projectId).orElse(null);
                if (project == null) continue;

                // Chỉ lấy Leader của dự án
                List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
                ProjectMember leader = members.stream()
                        .filter(m -> m.getRole() != null && (m.getRole().getName().equalsIgnoreCase("PROJECT_LEADER") || m.getRole().getName().equalsIgnoreCase("LEADER")))
                        .findFirst().orElse(null);
                
                if (leader == null || leader.getUser() == null) {
                    log.warn("No leader found for project {}. Skipping email.", projectId);
                    continue;
                }

                String leaderEmail = leader.getUser().getEmail();
                // Bỏ qua email giả / test (ví dụ: @devtrack.test, @test.local...)
                if (!isRealEmail(leaderEmail)) {
                    log.warn("Leader of project {} has fake/invalid email '{}'. Skipping.", projectId, leaderEmail);
                    continue;
                }

                String leaderName = leader.getUser().getUsername();
                if (leader.getUser().getProfile() != null && leader.getUser().getProfile().getFullName() != null) {
                    leaderName = leader.getUser().getProfile().getFullName();
                }

                // Lấy tất cả logs chưa gửi cho dự án này
                List<AuditLog> unsentLogs = auditLogRepository.findByProjectIdAndEmailSentFalseOrderByCreatedAtAsc(projectId);
                if (unsentLogs.isEmpty()) continue;

                log.info("Found {} unsent audit logs for project '{}'. Sending email to Leader: {}", unsentLogs.size(), project.getName(), leaderEmail);
                
                // Gửi email tổng hợp
                emailService.sendAuditDigestEmail(leaderEmail, leaderName, project.getName(), unsentLogs);

                // Đánh dấu là đã gửi
                for (AuditLog logItem : unsentLogs) {
                    logItem.setEmailSent(true);
                }
                auditLogRepository.saveAll(unsentLogs);
                log.info("Successfully sent digest and marked logs as sent for project '{}'.", project.getName());
                
            } catch (Exception e) {
                log.error("Error processing audit digest for project {}", projectId, e);
            }
        }
        
        log.info("Daily Audit Email Digest Job finished.");
    }

}
