package org.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectCloseRequest {

    public enum UnfinishedTaskAction {
        CANCEL_ALL,
        MOVE_TO_PROJECT
    }

    @NotBlank(message = "Lý do đóng project không được để trống.")
    @Size(min = 10, max = 1000, message = "Lý do phải từ 10 đến 1000 ký tự.")
    private String reason;

    private UnfinishedTaskAction unfinishedTaskAction = UnfinishedTaskAction.CANCEL_ALL;

    /** Chỉ dùng khi unfinishedTaskAction = MOVE_TO_PROJECT */
    private Long targetProjectId;
}
