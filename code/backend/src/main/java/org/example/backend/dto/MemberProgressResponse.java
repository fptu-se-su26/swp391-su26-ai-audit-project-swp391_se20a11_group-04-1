package org.example.backend.dto;

import lombok.*;

/**
 * Tiến độ của 1 thành viên trong project.
 * Dùng cho Daily Member Progress panel và Weekly Team Workload card.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberProgressResponse {

    private Long userId;
    private String name;
    private String email;
    private String initials;
    private String projectRole;    // LEADER, MEMBER, MENTOR

    // Task counts
    private int totalTasks;
    private int doneTasks;
    private int inProgressTasks;
    private int lateTasks;         // deadline < today AND status != DONE

    // Tính sẵn ở backend
    private int workloadPercent;   // (done + inProgress) / total * 100, có thể > 100
}
