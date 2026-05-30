package org.example.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintResponse {
    private Long id;
    private Long projectId;
    private String name;
    private String goal;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private BigDecimal capacityHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int totalTasks;
    private int doneTasks;
    private int inProgressTasks;
    private int blockedTasks;
    private int riskCount;
    private int progressPercent;
    private BigDecimal estimatedHours;
    private int capacityUsagePercent;
}
