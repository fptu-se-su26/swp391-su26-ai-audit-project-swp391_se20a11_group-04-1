package org.example.backend.dto.apitest;

import lombok.Data;

@Data
public class AssertionDto {
    private String type; // STATUS_CODE, JSON_PATH, HEADER, RESPONSE_TIME
    private String property; // e.g. "$.data.id" or "Content-Type"
    private String operator; // EQUALS, CONTAINS, GREATER_THAN, LESS_THAN, EXISTS
    private String expectedValue;
}
