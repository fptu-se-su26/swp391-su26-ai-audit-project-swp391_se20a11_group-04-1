package org.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class SprintRequest {
    private String name;
    private String goal;
    
    @jakarta.validation.constraints.NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @jakarta.validation.constraints.NotNull(message = "End date is required")
    private LocalDate endDate;
    
    private String status;
    private BigDecimal capacityHours;
}
