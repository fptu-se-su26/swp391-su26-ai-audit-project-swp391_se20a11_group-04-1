package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GateCheck {
    private String name;
    private String status; // PASS, FAIL, WARNING
    private String detail;
}
