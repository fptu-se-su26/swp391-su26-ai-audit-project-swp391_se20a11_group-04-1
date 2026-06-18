package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.SchedulerRunLogResponse;
import org.example.backend.entity.SchedulerRunLog;
import org.example.backend.repository.SchedulerRunLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/scheduler-logs")
@RequiredArgsConstructor
public class SchedulerRunLogController {

    private final SchedulerRunLogRepository schedulerRunLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SchedulerRunLogResponse>>> getLogs(
            @RequestParam(required = false) String jobName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized"));
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<SchedulerRunLog> logPage;

        if (jobName != null && !jobName.trim().isEmpty()) {
            logPage = schedulerRunLogRepository.findByJobNameOrderByStartedAtDesc(jobName.trim(), pageable);
        } else {
            logPage = schedulerRunLogRepository.findAllByOrderByStartedAtDesc(pageable);
        }

        Page<SchedulerRunLogResponse> responsePage = logPage.map(SchedulerRunLogResponse::fromEntity);

        return ResponseEntity.ok(ApiResponse.success(responsePage, "Fetched logs successfully"));
    }
}
