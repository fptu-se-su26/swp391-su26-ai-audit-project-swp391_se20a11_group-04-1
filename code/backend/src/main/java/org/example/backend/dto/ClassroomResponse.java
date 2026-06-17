package org.example.backend.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomResponse {
    private Long id;
    private String subject;
    private String semester;
    private String academicYear;
    private int maxMembers;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private OwnerDto owner;
    private int memberCount; // We can aggregate this later or leave it 0 for now
    private int projectCount; // Aggregate this later

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnerDto {
        private Long id;
        private String fullName;
        private String email;
    }
}
