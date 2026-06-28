package org.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectReopenRequest {

    @NotBlank(message = "Lý do mở lại project không được để trống.")
    @Size(min = 10, max = 1000, message = "Lý do phải từ 10 đến 1000 ký tự.")
    private String reason;
}
