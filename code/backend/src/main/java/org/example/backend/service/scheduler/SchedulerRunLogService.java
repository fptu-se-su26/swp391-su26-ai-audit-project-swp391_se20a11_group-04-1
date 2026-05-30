package org.example.backend.service.scheduler;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.SchedulerRunLog;
import org.example.backend.repository.SchedulerRunLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SchedulerRunLogService {

    private final SchedulerRunLogRepository schedulerRunLogRepository;

    @Transactional
    public SchedulerRunLog start(String jobName) {
        return schedulerRunLogRepository.save(SchedulerRunLog.builder()
                .jobName(jobName)
                .status("RUNNING")
                .build());
    }

    @Transactional
    public void finish(SchedulerRunLog log, int scanned, int created, int sent) {
        log.setStatus("SUCCESS");
        log.setFinishedAt(LocalDateTime.now());
        log.setTotalScanned(scanned);
        log.setTotalCreated(created);
        log.setTotalSent(sent);
        schedulerRunLogRepository.save(log);
    }

    @Transactional
    public void fail(SchedulerRunLog log, Exception ex) {
        log.setStatus("FAILED");
        log.setFinishedAt(LocalDateTime.now());
        log.setErrorMessage(ex.getMessage());
        schedulerRunLogRepository.save(log);
    }
}
