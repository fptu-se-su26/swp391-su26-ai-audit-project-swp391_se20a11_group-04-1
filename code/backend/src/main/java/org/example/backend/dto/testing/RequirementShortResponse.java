package org.example.backend.dto.testing;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequirementShortResponse {
    private Long id;
    private String code;
    private String title;
}
