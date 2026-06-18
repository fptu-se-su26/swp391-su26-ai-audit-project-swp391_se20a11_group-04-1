package org.example.backend.dto;

import lombok.Builder;

import java.time.LocalDate;

@Builder
public record SprintOptionResponse(
        Long id,
        String name,
        String status,
        LocalDate startDate,
        LocalDate endDate
) {
}
