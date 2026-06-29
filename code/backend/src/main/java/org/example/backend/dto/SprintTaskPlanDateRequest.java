package org.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SprintTaskPlanDateRequest {
    private LocalDate sprintPlanDate;
}
