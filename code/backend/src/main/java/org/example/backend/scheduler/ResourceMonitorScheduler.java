package org.example.backend.scheduler;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.NotificationWebSocketHandler;
import org.example.backend.dto.admin.resource.KafkaStatusResponse;
import org.example.backend.dto.admin.resource.KubernetesStatusResponse;
import org.example.backend.service.SystemResourceService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler chạy mỗi 5 giây để push trạng thái K8s + Kafka
 * xuống tất cả admin đang mở ResourceManagementPage qua WebSocket.
 *
 * Tận dụng kênh NotificationWebSocketHandler đã có sẵn,
 * broadcast payload với type = "RESOURCE_SNAPSHOT".
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ResourceMonitorScheduler {

    private final SystemResourceService systemResourceService;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelay = 5000)
    public void pushResourceSnapshot() {
        // BUG FIX #11: short-circuit khi không có ai đang kết nối — tránh I/O thừa mỗi 5s
        if (!NotificationWebSocketHandler.hasActiveSessions()) {
            return;
        }
        try {
            KubernetesStatusResponse k8s = systemResourceService.getKubernetesStatus();
            KafkaStatusResponse kafka = systemResourceService.getKafkaStatus();

            String payload = objectMapper.writeValueAsString(new ResourceSnapshotMessage(k8s, kafka));
            NotificationWebSocketHandler.broadcast(payload);
        } catch (Exception e) {
            log.warn("[ResourceMonitorScheduler] Failed to push resource snapshot: {}", e.getMessage());
        }
    }

    /**
     * Inner record đại diện cho payload gửi đi.
     * Jackson sẽ serialize thành:
     * { "type": "RESOURCE_SNAPSHOT", "data": { "k8s": {...}, "kafka": {...} } }
     */
    public record ResourceSnapshotMessage(
            String type,
            KubernetesStatusResponse k8s,
            KafkaStatusResponse kafka
    ) {
        public ResourceSnapshotMessage(KubernetesStatusResponse k8s, KafkaStatusResponse kafka) {
            this("RESOURCE_SNAPSHOT", k8s, kafka);
        }
    }
}
