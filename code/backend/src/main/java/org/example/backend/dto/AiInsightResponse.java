package org.example.backend.dto;

import lombok.*;

import java.util.List;

/**
 * AI Insight được tính toán từ data thực ở backend.
 * Không gọi AI API — chỉ build text từ rule-based logic.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiInsightResponse {

    private String velocityWarning;      // cảnh báo tiến độ chậm
    private String overloadedMember;     // thành viên bị overload
    private List<String> suggestions;    // gợi ý hành động
    private List<String> alerts;         // cảnh báo cụ thể
    private String generatedAt;          // thời điểm tính (ISO string)
}
