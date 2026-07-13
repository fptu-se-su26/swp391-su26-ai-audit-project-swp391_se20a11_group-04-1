package org.example.backend.dto.admin.resource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PodInfo {
    private String name;
    private String status;
    private int restarts;
    private String cpuRequest;
    private String memoryRequest;
    private String age;
}
