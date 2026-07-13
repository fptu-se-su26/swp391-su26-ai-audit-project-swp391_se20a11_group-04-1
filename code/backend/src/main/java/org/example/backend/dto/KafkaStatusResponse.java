package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class KafkaStatusResponse {

    private String status; // OK | UNAVAILABLE
    private String message;

    private String topic;
    private int totalPartitions;
    private int activeConsumers;
    private long totalLag;
    private String consumerGroup;

    private List<PartitionLagInfo> partitions;

    @Data
    @Builder
    public static class PartitionLagInfo {
        private int partition;
        private long currentOffset;
        private long endOffset;
        private long lag;
        private String consumerId; // empty string if no active consumer on this partition
    }
}
