package org.example.backend.dto.admin.resource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartitionLagInfo {
    private int partition;
    private long lag;
    private long currentOffset;
    private long endOffset;
    private String consumerId;
    // Số jobs đang active trên partition này (đã nhận message, chưa hoàn thành)
    // Track qua Redis bởi worker — reset về 0 khi job xong
    private long activeJobs;
}
