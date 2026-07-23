package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.annotation.MonitoredJob;
import org.example.backend.entity.SystemHealthCheck;
import org.example.backend.service.HealthCheckService;
import org.example.backend.service.MonitoringAlertService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class SystemMonitorScheduler {

    private final HealthCheckService healthCheckService;
    private final MonitoringAlertService monitoringAlertService;

    // Cooldown: only send alert once per component per hour
    private static final long ALERT_COOLDOWN_MS = 60 * 60 * 1000L;
    private final Map<String, Instant> lastAlertSent = new ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 300000)
    @MonitoredJob(name = "SystemMonitorScheduler", alertAfterFailures = 2)
    public void runHealthChecks() {
        log.info("Starting scheduled system health checks...");
        List<SystemHealthCheck> results = healthCheckService.checkAll();
        for (SystemHealthCheck check : results) {
            if ("DOWN".equals(check.getStatus())) {
                Instant now = Instant.now();
                Instant last = lastAlertSent.get(check.getComponent());
                if (last == null || now.toEpochMilli() - last.toEpochMilli() > ALERT_COOLDOWN_MS) {
                    monitoringAlertService.sendHealthAlert(
                            check.getComponent(), check.getStatus(), check.getMessage());
                    lastAlertSent.put(check.getComponent(), now);
                } else {
                    log.debug("[HEALTH] Alert suppressed for {} (cooldown active)", check.getComponent());
                }
            } else {
                // Clear cooldown when component recovers
                lastAlertSent.remove(check.getComponent());
            }
            log.info("[HEALTH] {}: {} ({}ms)", check.getComponent(), check.getStatus(), check.getResponseTimeMs());
        }
        log.info("Finished scheduled system health checks.");
    }
}
