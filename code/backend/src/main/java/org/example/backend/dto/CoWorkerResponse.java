package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoWorkerResponse {
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private long sharedProjectsCount;
}
