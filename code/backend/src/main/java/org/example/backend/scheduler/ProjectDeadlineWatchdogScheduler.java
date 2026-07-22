package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.service.ProjectService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * ProjectDeadlineWatchdogScheduler - Tự động kiểm tra và đóng các dự án quá hạn (deadline < today)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectDeadlineWatchdogScheduler {

    private final ProjectService projectService;

    /**
     * Chạy định kỳ mỗi 10 phút để quét và chuyển trạng thái các dự án quá hạn sang ARCHIVED với lý do "Dự án đã quá hạn thời gian thực hiện"
     */
    @Scheduled(fixedDelay = 600000)
    public void scanAndCloseOverdueProjects() {
        try {
            log.info("🔍 [Scheduler] Scanning for overdue projects to auto-close...");
            int count = projectService.autoCloseOverdueProjects();
            if (count > 0) {
                log.info("✅ [Scheduler] Auto-closed {} overdue project(s).", count);
            }
        } catch (Exception e) {
            log.error("❌ [Scheduler] Error during scanAndCloseOverdueProjects execution", e);
        }
    }
}
