package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.TestRun;
import org.example.backend.repository.TestRunRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TestRunCleanupScheduler {

    private final TestRunRepository testRunRepository;

    @Scheduled(cron = "0 0 2 * * ?") // 2:00 AM every day
    @Transactional
    public void cleanupUnsavedTestRuns() {
        log.info("Starting cleanup of unsaved temporary TestRuns...");
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        
        List<TestRun> oldUnsavedRuns = testRunRepository.findByIsSavedFalseAndCreatedAtBefore(cutoff);
        if (!oldUnsavedRuns.isEmpty()) {
            testRunRepository.deleteAll(oldUnsavedRuns);
            log.info("Cleaned up {} old unsaved temporary TestRuns.", oldUnsavedRuns.size());
        } else {
            log.info("No old unsaved TestRuns found to clean up.");
        }
    }
}
