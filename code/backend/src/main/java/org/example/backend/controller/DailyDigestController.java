package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.example.backend.scheduler.TaskSlaScheduler;
import org.example.backend.service.digest.DailyDigestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DailyDigestController {

    private final TaskSlaScheduler taskSlaScheduler;
    private final DailyDigestService dailyDigestService;

    @PostMapping("/api/v1/digests/test-trigger")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'LEADER', 'MENTOR')")
    public ResponseEntity<Void> testTriggerDigests() {
        taskSlaScheduler.buildDailyDigests();
        taskSlaScheduler.sendDailyDigests();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/v1/projects/{projectId}/digests/test-trigger")
    @PreAuthorizeProjectMember
    public ResponseEntity<Void> testTriggerProjectDigests(@PathVariable Long projectId) {
        dailyDigestService.buildDailyDigestsForProject(projectId);
        dailyDigestService.sendPendingDailyDigestsForProject(projectId);
        return ResponseEntity.ok().build();
    }
}
