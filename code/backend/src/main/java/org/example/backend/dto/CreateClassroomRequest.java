package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateClassroomRequest {
    private String subject; // Extracted format: SU26-SWP391-SE20A11 or ProjectName - ClassName
    private String semester; // Enum string: SPRING, SUMMER, FALL, PERSONAL
    private String academicYear; // "2026", etc.
    private int maxMembers; // Limit max members (e.g. 50)
}
