package org.example.backend.aspect;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.example.backend.annotation.MonitoredJob;
import org.example.backend.entity.MonitoredJobStat;
import org.example.backend.repository.MonitoredJobStatRepository;
import org.example.backend.service.MonitoringAlertService;
import org.springframework.stereotype.Component;

import java.util.List;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class MonitoringAspect {

    private final MonitoredJobStatRepository monitoredJobStatRepository;
    private final MonitoringAlertService monitoringAlertService;

    @Around("@annotation(monitoredJob)")
    public Object monitor(ProceedingJoinPoint joinPoint, MonitoredJob monitoredJob) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long durationMs = System.currentTimeMillis() - start;
            saveSuccessStat(monitoredJob.name(), durationMs);
            return result;
        } catch (Throwable ex) {
            long durationMs = System.currentTimeMillis() - start;
            handleFailure(monitoredJob, durationMs, ex);
            throw ex;
        }
    }

    private void saveSuccessStat(String jobName, long durationMs) {
        try {
            // Note: Consecutive failures is reset to 0 upon success.
            MonitoredJobStat stat = MonitoredJobStat.builder()
                    .jobName(jobName)
                    .status("SUCCESS")
                    .durationMs(durationMs)
                    .consecutiveFailures(0)
                    .build();
            monitoredJobStatRepository.save(stat);
        } catch (Exception e) {
            log.error("Failed to save success stat for monitored job: {}", jobName, e);
        }
    }

    private void handleFailure(MonitoredJob monitoredJob, long durationMs, Throwable ex) {
        try {
            int prevFailures = 0;
            List<MonitoredJobStat> lastStats = monitoredJobStatRepository.findTop1ByJobNameOrderByExecutedAtDesc(monitoredJob.name());
            if (!lastStats.isEmpty()) {
                prevFailures = lastStats.get(0).getConsecutiveFailures();
            }

            int currentFailures = prevFailures + 1;

            MonitoredJobStat stat = MonitoredJobStat.builder()
                    .jobName(monitoredJob.name())
                    .status("FAILED")
                    .durationMs(durationMs)
                    .errorMessage(ex.getMessage())
                    .consecutiveFailures(currentFailures)
                    .build();
            monitoredJobStatRepository.save(stat);

            if (currentFailures >= monitoredJob.alertAfterFailures()) {
                monitoringAlertService.sendJobFailureAlert(monitoredJob.name(), currentFailures, ex.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to handle failure stat for monitored job: {}", monitoredJob.name(), e);
        }
    }
}
