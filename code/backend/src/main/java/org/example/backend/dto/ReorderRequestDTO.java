package org.example.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReorderRequestDTO {
    private List<Long> ids;
}
