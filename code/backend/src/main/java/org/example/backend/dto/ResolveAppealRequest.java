package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolveAppealRequest {
    private boolean approve;
    private String feedback;
}
