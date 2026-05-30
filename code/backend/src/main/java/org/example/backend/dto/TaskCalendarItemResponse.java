package org.example.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Task gọn dùng cho Daily/Weekly calendar view.
 * Chỉ chứa các field cần thiết để render card trên UI.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCalendarItemResponse {

    private Long id;
    private String taskCode;
    private String title;
    private String type;           // DEV, QA, DOCS, UI/UX, BUG
    private String priority;       // CRITICAL, HIGH, MEDIUM, LOW
    private String status;         // TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED
    private String displayStatus;  // OVERDUE, BLOCKED, IN_PROGRESS, IN_REVIEW, DONE, TODO, UPCOMING
    private LocalDate startDate;
    private LocalDate deadline;
    private BigDecimal estimatedHours;
    private LocalDateTime updatedAt;
    private String blockedReason;
    private String requirementCode;
    private Long requirementId;
    private Long sprintId;
    private String sprintName;
    private AssigneeInfo primaryAssignee;
    private int evidenceCount;

    // --- Span Task Rendering UI fields (Weekly View) ---
    private Integer spanStartIndex; // 0 (Mon) to 6 (Sun)
    private Integer spanLength;     // 1 to 7
    private Boolean isStartCut;     // True if actual start_date is before the week's Monday
    private Boolean isEndCut;       // True if actual deadline is after the week's Sunday
    private Integer topRowIndex;    // Computed by row packing algorithm

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssigneeInfo {
        private Long id;
        private String name;       // fullName hoặc username
        private String email;
        private String initials;   // 2 ký tự đầu tên
    }
}
