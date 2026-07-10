package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PartitionLagInfo {
    private int partition;
    private long currentOffset;
    private long endOffset;
    private long lag;
    /** Member ID đang consume partition này, null nếu không có */
    private String consumerId;
}
