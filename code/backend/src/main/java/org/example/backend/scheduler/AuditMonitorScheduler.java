package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.SchedulerRunLog;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.service.AuditService;
import org.example.backend.service.scheduler.SchedulerRunLogService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditMonitorScheduler {

    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;
    private final SchedulerRunLogService schedulerRunLogService;

    @Scheduled(fixedDelay = 300000)
    public void detectSuspiciousActivity() {
        SchedulerRunLog runLog = schedulerRunLogService.start("AuditMonitorScheduler");
        int flagged = 0;
        try {
            List<Object[]> rows = auditLogRepository.findSuspiciousUserIds();
            for (Object[] row : rows) {
                Long suspiciousUserId = ((Number) row[0]).longValue();
                long failCount = ((Number) row[1]).longValue();

                log.warn("[AUDIT] Suspicious activity: userId={}, failures={} in 5min", suspiciousUserId, failCount);

                auditService.publishSuccess(null, "SYSTEM",
                        "SUSPICIOUS_ACTIVITY_DETECTED", "UserAccount", suspiciousUserId,
                        Map.of("failCount", failCount, "windowMinutes", 5),
                        "INTERNAL", "SCHEDULER", "/audit/monitor", 0L);

                flagged++;
            }
            schedulerRunLogService.finish(runLog, rows.size(), flagged, 0);
        } catch (Exception e) {
            log.error("AuditMonitorScheduler failed", e);
            schedulerRunLogService.fail(runLog, e);
        }
    }
}
