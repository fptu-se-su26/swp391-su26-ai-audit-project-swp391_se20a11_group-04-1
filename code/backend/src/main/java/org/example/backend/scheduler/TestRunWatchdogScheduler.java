package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.example.backend.entity.TestRun;
import org.example.backend.entity.enums.TestRunStatus;
import org.example.backend.repository.TestExecutionRepository;
import org.example.backend.repository.TestRunRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.config.NotificationWebSocketHandler;
import org.example.backend.dto.testing.ws.TestRunProgressEvent;

@Component
@Slf4j
@RequiredArgsConstructor
public class TestRunWatchdogScheduler {

    private final TestRunRepository testRunRepository;
    private final TestExecutionRepository testExecutionRepository;
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final ObjectMapper objectMapper;
    private final org.example.backend.service.AgentTaskService agentTaskService;

    @Scheduled(cron = "0 * * * * *") // Mỗi phút
    @SchedulerLock(name = "testRunWatchdogTask", lockAtMostFor = "50s", lockAtLeastFor = "10s")
    @Transactional
    public void checkStaleTestRuns() {
        agentTaskService.handleTimeoutTasks();

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        List<TestRun> staleRuns = testRunRepository.findStaleRunningTestRuns(cutoff);

        if (staleRuns.isEmpty()) return;

        for (TestRun run : staleRuns) {
            run.setStatus(TestRunStatus.TIMED_OUT);
            run.setCompletedAt(LocalDateTime.now());
            testRunRepository.save(run);

            int abortedCount = testExecutionRepository.abortPendingAndRunningByTestRunId(
                run.getId(), "Aborted by Watchdog (Timeout)"
            );

            log.warn("[{}] TestRun {} marked as TIMED_OUT by Watchdog. {} executions ABORTED",
                run.getCorrelationId(), run.getId(), abortedCount);
                
            if (run.getCreatedBy() != null) {
                try {
                    notificationWebSocketHandler.sendToUser(
                        run.getCreatedBy().getId(),
                        objectMapper.writeValueAsString(TestRunProgressEvent.builder()
                            .type("TEST_RUN_COMPLETED")
                            .testRunId(run.getId())
                            .finalStatus(TestRunStatus.TIMED_OUT.name())
                            .abortedCount(abortedCount)
                            .correlationId(run.getCorrelationId())
                            .build())
                    );
                } catch (Exception e) {
                    log.error("Failed to send watchdog WebSocket event for TestRun {}", run.getId(), e);
                }
            }
        }
    }
}
