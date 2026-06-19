package org.example.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RandomGroupRequest {
    @NotNull(message = "Number of members per group is required")
    @Min(value = 1, message = "Group must have at least 1 member")
    private Integer membersPerGroup;
}
