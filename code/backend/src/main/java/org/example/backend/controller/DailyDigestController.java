package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.scheduler.TaskSlaScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/digests")
@RequiredArgsConstructor
public class DailyDigestController {

    private final TaskSlaScheduler taskSlaScheduler;

    @PostMapping("/test-trigger")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'LEADER', 'MENTOR')")
    public ResponseEntity<Void> testTriggerDigests() {
        taskSlaScheduler.buildDailyDigests();
        taskSlaScheduler.sendDailyDigests();
        return ResponseEntity.ok().build();
    }
}
