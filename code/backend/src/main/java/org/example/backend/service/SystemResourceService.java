package org.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.util.Config;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.*;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.example.backend.dto.admin.resource.*;
import org.example.backend.service.event.KafkaEventPublisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SystemResourceService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    // BUG FIX #3: default phải khớp với application.yaml (K8S_MONITORING_ENABLED default = true)
    @Value("${kubernetes.enabled:true}")
    private boolean kubernetesEnabled;

    @Value("${kubernetes.namespace:devtrack}")
    private String kubernetesNamespace;

    // BUG FIX #5: đọc từ config thay vì hardcode
    @Value("${kafka.admin.cache-ttl-seconds:5}")
    private int kafkaCacheTtlSeconds;

    @Value("${kafka.admin.topic:test-run-jobs}")
    private String kafkaTopic;

    @Value("${kafka.admin.consumer-group:playwright-service-group}")
    private String kafkaConsumerGroup;

    private AdminClient adminClient;

    @Value("${app.events.publisher:local}")
    private String eventPublisher;

    @PostConstruct
    public void init() {
        if (!"local".equalsIgnoreCase(eventPublisher)) {
            Properties props = new Properties();
            props.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
            props.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, 5000);
            this.adminClient = AdminClient.create(props);
        }

        if (kubernetesEnabled) {
            try {
                ApiClient client = Config.defaultClient();
                client.setReadTimeout(10000);
                client.setConnectTimeout(10000);
                Configuration.setDefaultApiClient(client);
            } catch (Exception e) {
                log.warn("Failed to configure Kubernetes client: {}", e.getMessage());
            }
        }
    }

    // BUG FIX #6: đóng AdminClient khi shutdown để tránh connection leak
    @PreDestroy
    public void destroy() {
        if (adminClient != null) {
            try {
                adminClient.close(Duration.ofSeconds(5));
                log.info("AdminClient closed cleanly.");
            } catch (Exception e) {
                log.warn("Error closing AdminClient: {}", e.getMessage());
            }
        }
    }

    public KubernetesStatusResponse getKubernetesStatus() {
        if (!kubernetesEnabled) {
            return KubernetesStatusResponse.builder()
                    .status("UNAVAILABLE")
                    .pods(Collections.emptyList())
                    .scaler(null)
                    .build();
        }

        try {
            // client-java 21.x calls validateJsonObject() inside ALL typed deserializers,
            // including CoreV1Api — it throws on any unknown field from K8s 1.29+ (e.g. observedGeneration).
            // Fix: use the raw OkHttp client to GET pods as a plain string, then parse with Jackson
            // which is configured to ignore unknown fields.
            ApiClient apiClient = Configuration.getDefaultApiClient();
            String basePath = apiClient.getBasePath(); // e.g. https://127.0.0.1:PORT

            okhttp3.OkHttpClient httpClient = apiClient.getHttpClient();
            String url = basePath + "/api/v1/namespaces/" + kubernetesNamespace
                    + "/pods?labelSelector=app%3Dplaywright-worker";

            okhttp3.Request request = new okhttp3.Request.Builder()
                    .url(url)
                    .build();

            String body;
            try (okhttp3.Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) {
                    throw new RuntimeException("K8s pods API returned: " + response.code());
                }
                body = response.body().string();
            }

            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(body);
            com.fasterxml.jackson.databind.JsonNode items = root.path("items");

            List<PodInfo> pods = new ArrayList<>();
            if (items.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode pod : items) {
                    String name = pod.path("metadata").path("name").asText("unknown");
                    String status = pod.path("status").path("phase").asText("Unknown");
                    int restarts = 0;
                    com.fasterxml.jackson.databind.JsonNode containerStatuses = pod.path("status").path("containerStatuses");
                    if (containerStatuses.isArray() && containerStatuses.size() > 0) {
                        restarts = containerStatuses.get(0).path("restartCount").asInt(0);
                    }
                    String age = pod.path("metadata").path("creationTimestamp").asText("");

                    String cpu = "";
                    String mem = "";
                    com.fasterxml.jackson.databind.JsonNode requests = pod
                            .path("spec").path("containers").path(0)
                            .path("resources").path("requests");
                    if (!requests.isMissingNode()) {
                        cpu = requests.path("cpu").asText("");
                        mem = requests.path("memory").asText("");
                    }

                    pods.add(PodInfo.builder()
                            .name(name).status(status).restarts(restarts)
                            .cpuRequest(cpu).memoryRequest(mem).age(age)
                            .build());
                }
            }

            // Fetch KEDA ScaledObject — also via raw HTTP to avoid same issue
            KedaScalerInfo scalerInfo = null;
            try {
                String kedaUrl = basePath + "/apis/keda.sh/v1alpha1/namespaces/"
                        + kubernetesNamespace + "/scaledobjects/playwright-worker-scaler";
                okhttp3.Request kedaRequest = new okhttp3.Request.Builder().url(kedaUrl).build();
                try (okhttp3.Response kedaResp = httpClient.newCall(kedaRequest).execute()) {
                    if (kedaResp.isSuccessful() && kedaResp.body() != null) {
                        com.fasterxml.jackson.databind.JsonNode kedaNode =
                                objectMapper.readTree(kedaResp.body().string());
                        scalerInfo = parseKedaNode(kedaNode);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch KEDA ScaledObject: {}", e.getMessage());
            }

            return KubernetesStatusResponse.builder()
                    .status("OK")
                    .pods(pods)
                    .scaler(scalerInfo)
                    .build();

        } catch (Exception e) {
            log.debug("Error fetching Kubernetes status: {}", e.getMessage());
            return KubernetesStatusResponse.builder()
                    .status("UNAVAILABLE")
                    .pods(Collections.emptyList())
                    .scaler(null)
                    .build();
        }
    }

    private KedaScalerInfo parseKedaNode(com.fasterxml.jackson.databind.JsonNode node) {
        if (node == null || node.isMissingNode()) return null;
        try {
            com.fasterxml.jackson.databind.JsonNode spec = node.path("spec");
            com.fasterxml.jackson.databind.JsonNode status = node.path("status");

            int minReplicas = spec.path("minReplicaCount").asInt(0);
            int maxReplicas = spec.path("maxReplicaCount").asInt(0);
            int cooldownPeriod = spec.path("cooldownPeriod").asInt(0);

            int lagThreshold = 0;
            com.fasterxml.jackson.databind.JsonNode triggers = spec.path("triggers");
            if (triggers.isArray() && triggers.size() > 0) {
                String lt = triggers.get(0).path("metadata").path("lagThreshold").asText("");
                if (!lt.isEmpty()) {
                    try { lagThreshold = Integer.parseInt(lt); } catch (NumberFormatException ignored) {}
                }
            }

            int currentReplicas = status.path("currentReplicas").asInt(0);
            boolean isActive = false;
            com.fasterxml.jackson.databind.JsonNode conditions = status.path("conditions");
            if (conditions.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode c : conditions) {
                    if ("Active".equals(c.path("type").asText()) && "True".equals(c.path("status").asText())) {
                        isActive = true;
                        break;
                    }
                }
            }
            String lastScaleTime = status.path("lastActiveTime").asText("");

            return KedaScalerInfo.builder()
                    .minReplicas(minReplicas).maxReplicas(maxReplicas)
                    .currentReplicas(currentReplicas).lagThreshold(lagThreshold)
                    .active(isActive).cooldownPeriod(cooldownPeriod)
                    .lastScaleTime(lastScaleTime)
                    .build();
        } catch (Exception e) {
            log.warn("Error parsing KEDA node", e);
            return null;
        }
    }

    public KafkaStatusResponse getKafkaStatus() {
        String CACHE_KEY = "admin:resource:kafkaStatus";
        try {
            String cached = redisTemplate.opsForValue().get(CACHE_KEY);
            if (cached != null) {
                return objectMapper.readValue(cached, KafkaStatusResponse.class);
            }
        } catch (Exception e) {
            if (e instanceof IllegalStateException && e.getMessage() != null && e.getMessage().contains("LettuceConnectionFactory is STOPPING")) {
                log.debug("Skipping Redis cache read during shutdown");
            } else {
                log.warn("Redis cache read error", e);
            }
        }

        if (adminClient == null) {
            return KafkaStatusResponse.builder()
                    .status("DISABLED")
                    .totalPartitions(0)
                    .activeConsumers(0)
                    .totalLag(0)
                    .partitionDetails(java.util.Collections.emptyList())
                    .build();
        }

        try {
            // BUG FIX #5: dùng config thay vì hardcode
            String topicName = kafkaTopic;
            String groupId = kafkaConsumerGroup;

            DescribeTopicsResult describeTopics = adminClient.describeTopics(Collections.singleton(topicName));
            TopicDescription topicDescription = describeTopics.allTopicNames().get().get(topicName);
            int totalPartitions = topicDescription.partitions().size();

            DescribeConsumerGroupsResult describeGroup = adminClient.describeConsumerGroups(Collections.singleton(groupId));
            ConsumerGroupDescription groupDescription = describeGroup.describedGroups().get(groupId).get();
            int activeConsumers = groupDescription.members().size();

            ListConsumerGroupOffsetsResult offsetsResult = adminClient.listConsumerGroupOffsets(groupId);
            Map<TopicPartition, OffsetAndMetadata> groupOffsets = offsetsResult.partitionsToOffsetAndMetadata().get();

            List<TopicPartition> topicPartitions = new ArrayList<>();
            for (int i = 0; i < totalPartitions; i++) {
                topicPartitions.add(new TopicPartition(topicName, i));
            }

            ListOffsetsResult endOffsetsResult = adminClient.listOffsets(
                    topicPartitions.stream().collect(Collectors.toMap(tp -> tp, tp -> OffsetSpec.latest()))
            );
            Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> endOffsets = endOffsetsResult.all().get();

            long totalLag = 0;
            List<PartitionLagInfo> partitionDetails = new ArrayList<>();

            for (TopicPartition tp : topicPartitions) {
                long endOffset = endOffsets.get(tp).offset();
                // BUG FIX #2: partition chưa bao giờ được consume → currentOffset = 0L (đầu log),
                // không phải endOffset. Điều này cho thấy lag thực tế thay vì giả là 0.
                long currentOffset = groupOffsets.containsKey(tp) ? groupOffsets.get(tp).offset() : 0L;
                long lag = Math.max(0, endOffset - currentOffset);
                totalLag += lag;

                String consumerId = "none";
                for (MemberDescription member : groupDescription.members()) {
                    if (member.assignment().topicPartitions().contains(tp)) {
                        consumerId = member.consumerId();
                        break;
                    }
                }

                long activeJobs = 0;
                try {
                    String activeStr = redisTemplate.opsForValue().get("kafka:partition:" + tp.partition() + ":active");
                    if (activeStr != null) activeJobs = Math.max(0, Long.parseLong(activeStr));
                } catch (Exception ignored) {}

                partitionDetails.add(PartitionLagInfo.builder()
                        .partition(tp.partition())
                        .lag(lag)
                        .currentOffset(currentOffset)
                        .endOffset(endOffset)
                        .consumerId(consumerId)
                        .activeJobs(activeJobs)
                        .build());
            }

            KafkaStatusResponse response = KafkaStatusResponse.builder()
                    .status("OK")
                    .totalPartitions(totalPartitions)
                    .activeConsumers(activeConsumers)
                    .totalLag(totalLag)
                    .partitionDetails(partitionDetails)
                    .build();

            // Nếu AdminClient thấy lag = 0 nhưng vẫn còn inflight jobs
            // (consumer kịp commit trước polling interval), dùng inflight counter làm fallback
            // để dashboard bắt được spike ngay cả khi consumer xử lý cực nhanh
            if (totalLag == 0) {
                try {
                    String inflightStr = redisTemplate.opsForValue().get(KafkaEventPublisher.INFLIGHT_KEY);
                    if (inflightStr != null) {
                        long inflight = Long.parseLong(inflightStr);
                        if (inflight > 0) {
                            log.debug("AdminClient lag=0 but inflight={}, using inflight as effective lag", inflight);
                            response = KafkaStatusResponse.builder()
                                    .status("OK")
                                    .totalPartitions(totalPartitions)
                                    .activeConsumers(activeConsumers)
                                    .totalLag(inflight)
                                    .partitionDetails(partitionDetails)
                                    .build();
                        }
                    }
                } catch (Exception e) {
                    if (e instanceof IllegalStateException && e.getMessage() != null && e.getMessage().contains("LettuceConnectionFactory is STOPPING")) {
                        log.debug("Skipping inflight counter read during shutdown");
                    } else {
                        log.warn("Failed to read inflight counter for lag fallback", e);
                    }
                }
            }

            try {
                // Chỉ cache khi không có inflight jobs — tránh cache stale lag data
                // Nếu có inflight, không cache để lần poll tiếp theo đọc lại AdminClient + counter fresh
                if (totalLag == 0) {
                    String inflightStr = redisTemplate.opsForValue().get(KafkaEventPublisher.INFLIGHT_KEY);
                    boolean hasInflight = inflightStr != null && Long.parseLong(inflightStr) > 0;
                    if (!hasInflight) {
                        redisTemplate.opsForValue().set(CACHE_KEY, objectMapper.writeValueAsString(response), Duration.ofSeconds(kafkaCacheTtlSeconds));
                    }
                }
                // Khi có lag thật (nhiều messages), vẫn cache ngắn để tránh spam AdminClient
                else {
                    redisTemplate.opsForValue().set(CACHE_KEY, objectMapper.writeValueAsString(response), Duration.ofSeconds(1));
                }
            } catch (Exception e) {
                if (e instanceof IllegalStateException && e.getMessage() != null && e.getMessage().contains("LettuceConnectionFactory is STOPPING")) {
                    log.debug("Skipping Redis cache write during shutdown");
                } else {
                    log.warn("Redis cache write error", e);
                }
            }

            return response;

        } catch (Exception e) {
            log.error("Error fetching Kafka status", e);
            return KafkaStatusResponse.builder()
                    .status("UNAVAILABLE")
                    .totalPartitions(0)
                    .activeConsumers(0)
                    .totalLag(0)
                    .partitionDetails(Collections.emptyList())
                    .build();
        }
    }
}
