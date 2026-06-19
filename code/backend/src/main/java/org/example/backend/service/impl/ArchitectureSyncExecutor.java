package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.ArchitectureSync;
import org.example.backend.entity.mongo.ArchitectureGraph;
import org.example.backend.repository.ArchitectureSyncRepository;
import org.example.backend.repository.mongo.ArchitectureGraphRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class ArchitectureSyncExecutor {

    private final ArchitectureSyncRepository architectureSyncRepository;
    private final ArchitectureGraphRepository architectureGraphRepository;
    private final StringRedisTemplate redisTemplate;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${architecture-parser.url:http://localhost:4002}")
    private String parserUrl;

    @Async
    public void executeSync(Long projectId, Long syncRecordId, String repoUrl, String token, String branch) {
        log.info("Starting async architecture sync for project {}", projectId);
        String progressKey = "arch:progress:" + projectId;
        
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("repoUrl", repoUrl);
            request.put("token", token);
            request.put("branch", branch);
            request.put("projectId", projectId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String url = parserUrl + "/parse";
            log.info("Calling parser microservice at: {}", url);
            
            ResponseEntity<String> responseEntity = restTemplate.postForEntity(url, entity, String.class);

            if (responseEntity.getStatusCode() == HttpStatus.OK && responseEntity.getBody() != null) {
                ArchitectureGraph graph = objectMapper.readValue(responseEntity.getBody(), ArchitectureGraph.class);
                graph.setProjectId(projectId);
                graph.setSyncedAt(LocalDateTime.now());
                graph.setBranch(branch);
                
                architectureGraphRepository.deleteByProjectId(projectId);
                
                ArchitectureGraph savedGraph = architectureGraphRepository.save(graph);
                
                ArchitectureSync syncRecord = architectureSyncRepository.findById(syncRecordId)
                        .orElseThrow(() -> new IllegalStateException("Sync record not found"));
                
                syncRecord.setStatus("READY");
                syncRecord.setProgress(100);
                syncRecord.setCurrentStep("Phân tích hoàn tất!");
                syncRecord.setMongoGraphId(savedGraph.getId());
                syncRecord.setErrorMessage(null);
                syncRecord.setLastSyncAt(LocalDateTime.now());
                architectureSyncRepository.save(syncRecord);
                
                log.info("Architecture sync successful for project {}", projectId);
            } else {
                throw new RuntimeException("Parser service returned status " + responseEntity.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Failed to sync architecture for project {}", projectId, e);
            
            architectureSyncRepository.findById(syncRecordId).ifPresent(syncRecord -> {
                syncRecord.setStatus("ERROR");
                syncRecord.setProgress(0);
                syncRecord.setCurrentStep("Lỗi phân tích kiến trúc");
                syncRecord.setErrorMessage(e.getMessage());
                architectureSyncRepository.save(syncRecord);
            });

            try {
                Map<String, Object> errorMap = new HashMap<>();
                errorMap.put("status", "ERROR");
                errorMap.put("progress", 0);
                errorMap.put("currentStep", "Lỗi phân tích kiến trúc: " + e.getMessage());
                errorMap.put("errorMessage", e.getMessage());
                
                redisTemplate.opsForValue().set(
                        progressKey, 
                        objectMapper.writeValueAsString(errorMap), 
                        10, 
                        TimeUnit.MINUTES
                );
            } catch (Exception ex) {
                log.error("Failed to write error to Redis", ex);
            }
            
        } finally {
            try {
                redisTemplate.delete(progressKey);
                
                Set<String> keys = redisTemplate.keys("arch:graph:" + projectId + ":*");
                if (keys != null && !keys.isEmpty()) {
                    redisTemplate.delete(keys);
                }
            } catch (Exception ex) {
                log.error("Failed to clean up Redis cache keys", ex);
            }
        }
    }
}
