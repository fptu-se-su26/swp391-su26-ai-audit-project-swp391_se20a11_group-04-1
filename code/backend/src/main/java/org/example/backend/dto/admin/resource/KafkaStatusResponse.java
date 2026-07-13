package org.example.backend.dto.admin.resource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KafkaStatusResponse {
    private String status;
    private int totalPartitions;
    private int activeConsumers;
    private long totalLag;
    private List<PartitionLagInfo> partitionDetails;
}
