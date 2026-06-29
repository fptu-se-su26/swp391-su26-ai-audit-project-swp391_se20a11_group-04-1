package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.annotation.MonitoredJob;
import org.example.backend.entity.SystemHealthCheck;
import org.example.backend.service.HealthCheckService;
import org.example.backend.service.MonitoringAlertService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SystemMonitorScheduler {

    private final HealthCheckService healthCheckService;
    private final MonitoringAlertService monitoringAlertService;

    @Scheduled(fixedDelay = 300000)
    @MonitoredJob(name = "SystemMonitorScheduler", alertAfterFailures = 2)
    public void runHealthChecks() {
        log.info("Starting scheduled system health checks...");
        List<SystemHealthCheck> results = healthCheckService.checkAll();
        for (SystemHealthCheck check : results) {
            if ("DOWN".equals(check.getStatus())) {
                monitoringAlertService.sendHealthAlert(
                        check.getComponent(), check.getStatus(), check.getMessage());
            }
            log.info("[HEALTH] {}: {} ({}ms)", check.getComponent(), check.getStatus(), check.getResponseTimeMs());
        }
        log.info("Finished scheduled system health checks.");
    }
}
