package org.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Response cho GET /api/v1/projects/{projectId}/tasks/weekly?weekStart=YYYY-MM-DD
 * Backend tính toán sẵn, frontend chỉ render.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyViewResponse {

    private LocalDate weekStart;
    private LocalDate weekEnd;
    private String weekLabel;          // e.g. "Week 22 · 26/05 – 01/06/2026"

    // ── Span Tasks (kéo dài nhiều ngày) ──────────────────────────────────────
    private List<TaskCalendarItemResponse> spanTasks;

    // ── 7-column grid ─────────────────────────────────────────────────────────
    /**
     * Key = "YYYY-MM-DD" (T2 → CN)
     * Value = danh sách task có deadline trong ngày đó
     */
    private Map<String, List<TaskCalendarItemResponse>> tasksByDay;

    // ── Stats bar ─────────────────────────────────────────────────────────────
    private WeeklyStats weekStats;

    // ── Sprint banner ─────────────────────────────────────────────────────────
    private SprintInfo activeSprint;

    // ── Right panel ───────────────────────────────────────────────────────────
    private SprintProgress sprintProgress;
    private List<MemberProgressResponse> teamWorkload;
    private AiInsightResponse aiInsight;

    // ─────────────────────────────────────────────────────────────────────────

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeeklyStats {
        private int total;             // tổng task có deadline trong tuần
        private int completed;         // status = DONE
        private int overdue;           // deadline < today AND status != DONE
        private int blocked;           // status = BLOCKED
        private int rtmCoverage;       // % requirement có task (0-100)
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SprintInfo {
        private Long id;
        private String name;
        private String goal;
        private LocalDate startDate;
        private LocalDate endDate;
        private String status;         // PLANNED, ACTIVE, COMPLETED
        private int daysLeft;          // số ngày còn lại đến endDate
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SprintProgress {
        private int percent;           // % task DONE trong sprint
        private int tasksDone;
        private int tasksTotal;
        private int storyPointsDone;   // dùng estimatedHours làm proxy
        private int storyPointsTotal;
        /** Số task done theo từng ngày trong tuần (index 0=T2 ... 6=CN) */
        private List<Integer> dailyCompletion;
    }
}
