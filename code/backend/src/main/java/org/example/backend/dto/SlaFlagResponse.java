package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaFlagResponse {
    private String label;
    private String tone;
    private int count;
}
