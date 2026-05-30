package org.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Response cho GET /api/v1/projects/{projectId}/tasks/daily?date=YYYY-MM-DD
 * Backend tính toán sẵn, frontend chỉ render.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyViewResponse {

    private LocalDate date;

    // ── 3 cột chính ──────────────────────────────────────────────────────────
    /** Task quá hạn (deadline < date AND status != DONE) + task BLOCKED */
    private List<TaskCalendarItemResponse> overdueTasks;

    /** Task đến hạn hôm nay (deadline = date AND status != DONE) */
    private List<TaskCalendarItemResponse> dueTasks;

    /** Task đang diễn ra (startDate <= date AND deadline > date AND status != DONE) */
    private List<TaskCalendarItemResponse> ongoingTasks;

    /** Task hoàn thành hôm nay (status = DONE AND updatedAt::date = date) */
    private List<TaskCalendarItemResponse> doneTasks;

    // ── Stats cho TopBar ──────────────────────────────────────────────────────
    private DailyStats stats;

    // ── Right panel ───────────────────────────────────────────────────────────
    private List<MemberProgressResponse> memberProgress;
    private AiInsightResponse aiInsight;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyStats {
        private int overdueCount;
        private int dueCount;
        private int ongoingCount;
        private int inProgressCount;   // tổng task IN_PROGRESS trong project
        private int doneCount;
        private int totalToday;        // overdue + due + done
        private int progressPercent;   // doneCount / totalToday * 100
    }
}
