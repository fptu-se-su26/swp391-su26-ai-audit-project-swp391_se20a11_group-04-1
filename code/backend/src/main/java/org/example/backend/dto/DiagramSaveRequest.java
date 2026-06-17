package org.example.backend.dto;

import lombok.Data;

@Data
public class DiagramSaveRequest {
    private String layoutData;
    private String imageBase64;
}
