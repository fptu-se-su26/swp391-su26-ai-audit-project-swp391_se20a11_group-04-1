package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.SlaAnalysisJob;
import org.example.backend.repository.SlaAnalysisJobRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaAnalysisJobService {

    private final SlaAnalysisJobRepository slaAnalysisJobRepository;
    private final SlaReliabilityMetricsService slaReliabilityMetricsService;

    public SlaAnalysisJob createJob(Long projectId, Long sprintId, Long userId) {
        Optional<SlaAnalysisJob> existingJob = slaAnalysisJobRepository.findFirstByProjectIdAndSprintIdAndStatusInOrderByCreatedAtDesc(
                projectId, sprintId, java.util.Arrays.asList("PENDING", "RUNNING"));
        
        if (existingJob.isPresent()) {
            log.warn("SLA Analysis Job already in progress for project {} sprint {}. Returning existing job {}", 
                    projectId, sprintId, existingJob.get().getId());
            return existingJob.get();
        }

        SlaAnalysisJob job = SlaAnalysisJob.builder()
                .projectId(projectId)
                .sprintId(sprintId)
                .triggeredBy(userId)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        try {
            return slaAnalysisJobRepository.save(job);
        } catch (DataIntegrityViolationException e) {
            log.warn("Race condition detected: active SLA Analysis Job already exists for project {} sprint {}",
                    projectId, sprintId);
            return slaAnalysisJobRepository.findFirstByProjectIdAndSprintIdAndStatusInOrderByCreatedAtDesc(
                            projectId, sprintId, java.util.Arrays.asList("PENDING", "RUNNING"))
                    .orElseThrow(() -> e);
        }
    }

    public Optional<SlaAnalysisJob> getJob(Long jobId) {
        return slaAnalysisJobRepository.findById(jobId);
    }

    @Async("slaJobExecutor")
    public void runJobAsync(Long jobId) {
        SlaAnalysisJob job = slaAnalysisJobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.warn("SLA Analysis Job {} not found, cannot execute.", jobId);
            return;
        }

        if (!"PENDING".equals(job.getStatus())) {
            log.warn("SLA Analysis Job {} is already {}. Skipping duplicate execution.", jobId, job.getStatus());
            return;
        }

        try {
            job.setStatus("RUNNING");
            job.setStartedAt(LocalDateTime.now());
            slaAnalysisJobRepository.save(job);

            log.info("Executing SLA Analysis Job {} for project {} sprint {}", jobId, job.getProjectId(), job.getSprintId());
            
            // This will compute, persist and return the report (we ignore return here)
            slaReliabilityMetricsService.computeAndPersist(job.getProjectId(), job.getSprintId());

            job.setStatus("DONE");
            job.setCompletedAt(LocalDateTime.now());
            slaAnalysisJobRepository.save(job);
            
            log.info("SLA Analysis Job {} completed successfully.", jobId);
        } catch (Exception e) {
            log.error("SLA Analysis Job {} failed", jobId, e);
            job.setStatus("FAILED");
            job.setCompletedAt(LocalDateTime.now());
            job.setErrorMessage(e.getMessage());
            slaAnalysisJobRepository.save(job);
        }
    }
}
