package org.example.backend.entity;

public record SprintMemberSummary(
    Long userId,
    String name,
    int totalAssigned,
    int completedOnTime,
    int overdueCount,
    int penalizedCount,
    double onTimeRate,
    String riskLevel,
    String aiComment
) {}
