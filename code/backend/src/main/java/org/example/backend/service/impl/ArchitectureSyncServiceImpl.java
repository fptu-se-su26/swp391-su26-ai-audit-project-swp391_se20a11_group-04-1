package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.ArchitectureSync;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.mongo.ArchitectureGraph;
import org.example.backend.entity.mongo.GraphEdge;
import org.example.backend.entity.mongo.GraphNode;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ArchitectureSyncRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.mongo.ArchitectureGraphRepository;
import org.example.backend.service.ArchitectureSyncService;
import org.example.backend.service.ManualArchitectureService;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArchitectureSyncServiceImpl implements ArchitectureSyncService {

    private final ArchitectureSyncRepository architectureSyncRepository;
    private final ArchitectureGraphRepository architectureGraphRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserAccountRepository userAccountRepository;
    private final GitHubIntegrationService gitHubIntegrationService;
    private final ArchitectureSyncExecutor architectureSyncExecutor;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final ManualArchitectureService manualArchitectureService;

    @Override
    @Transactional(readOnly = true)
    public ArchitectureSync getSyncStatus(Long projectId, Long userId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        String redisKey = "arch:progress:" + projectId;
        String progressData = redisTemplate.opsForValue().get(redisKey);
        
        if (progressData != null) {
            try {
                Map<String, Object> data = objectMapper.readValue(progressData, new TypeReference<Map<String, Object>>(){});
                
                return ArchitectureSync.builder()
                        .status((String) data.get("status"))
                        .progress((Integer) data.get("progress"))
                        .currentStep((String) data.get("currentStep"))
                        .errorMessage((String) data.get("errorMessage"))
                        .build();
            } catch (Exception e) {
                log.error("Failed to parse progress from Redis", e);
            }
        }

        return architectureSyncRepository.findByProjectId(projectId)
                .orElse(ArchitectureSync.builder()
                        .status("IDLE")
                        .progress(0)
                        .currentStep("Chưa bắt đầu phân tích")
                        .build());
    }

    @Override
    @Transactional
    public ArchitectureSync triggerSync(Long projectId, Long userId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        String roleName = member.getRole() != null ? member.getRole().getName().toUpperCase() : "";
        if (roleName.contains("MENTOR")) {
            throw new CustomException("Mentor cannot trigger sync", HttpStatus.FORBIDDEN);
        }

        GitHubIntegration integration = gitHubIntegrationService.getIntegration(projectId, userId);
        if (integration == null) {
            throw new CustomException("Vui lòng cấu hình kết nối GitHub cho dự án trước.", HttpStatus.BAD_REQUEST);
        }

        String decryptedToken = gitHubIntegrationService.getDecryptedUserToken(userId);
        if (decryptedToken == null || decryptedToken.trim().isEmpty()) {
            throw new CustomException("Vui lòng kết nối tài khoản GitHub của bạn trước.", HttpStatus.BAD_REQUEST);
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        ArchitectureSync syncRecord = architectureSyncRepository.findByProjectId(projectId)
                .orElse(ArchitectureSync.builder().project(project).build());

        syncRecord.setStatus("SYNCING");
        syncRecord.setProgress(5);
        syncRecord.setCurrentStep("Đang khởi chạy tiến trình phân tích...");
        syncRecord.setSyncedBy(user);
        syncRecord.setLastSyncAt(LocalDateTime.now());
        
        String branch = "main";
        syncRecord.setBranch(branch);
        syncRecord.setErrorMessage(null);
        
        ArchitectureSync savedRecord = architectureSyncRepository.save(syncRecord);

        String progressKey = "arch:progress:" + projectId;
        try {
            Map<String, Object> progressMap = new HashMap<>();
            progressMap.put("status", "SYNCING");
            progressMap.put("progress", 5);
            progressMap.put("currentStep", "Đang khởi chạy tiến trình phân tích...");
            progressMap.put("errorMessage", null);
            
            redisTemplate.opsForValue().set(
                    progressKey, 
                    objectMapper.writeValueAsString(progressMap), 
                    10, 
                    TimeUnit.MINUTES
            );
        } catch (Exception e) {
            log.error("Failed to write initial progress to Redis", e);
        }

        String repoUrl = String.format("https://github.com/%s/%s", integration.getRepoOwner(), integration.getRepoName());
        
        // Execute sync in background
        architectureSyncExecutor.executeSync(projectId, savedRecord.getId(), repoUrl, decryptedToken, branch);

        return savedRecord;
    }

    @Override
    @Transactional(readOnly = true)
    public ArchitectureGraph getGraphData(Long projectId, Long userId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        String cacheKey = String.format("arch:graph:%d:all", projectId);
        String cachedGraph = redisTemplate.opsForValue().get(cacheKey);
        
        if (cachedGraph != null) {
            try {
                return objectMapper.readValue(cachedGraph, ArchitectureGraph.class);
            } catch (Exception e) {
                log.error("Failed to parse cached graph from Redis", e);
            }
        }

        ArchitectureGraph fullGraph = architectureGraphRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("Kiến trúc dự án chưa được phân tích. Vui lòng bấm Sync trước.", HttpStatus.NOT_FOUND));

        fullGraph = manualArchitectureService.mergeManualOverrides(projectId, fullGraph);

        try {
            redisTemplate.opsForValue().set(
                    cacheKey, 
                    objectMapper.writeValueAsString(fullGraph), 
                    12, 
                    TimeUnit.HOURS
            );
        } catch (Exception e) {
            log.error("Failed to cache graph to Redis", e);
        }

        return fullGraph;
    }

    @Override
    @Transactional
    public void saveNodePositions(Long projectId, Map<String, ArchitectureGraph.Position2D> positions, Long userId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        ArchitectureGraph graph = architectureGraphRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("Graph not found", HttpStatus.NOT_FOUND));

        Map<String, ArchitectureGraph.Position2D> currentPositions = graph.getManualPositions();
        if (currentPositions == null) {
            currentPositions = new HashMap<>();
        }
        currentPositions.putAll(positions);
        graph.setManualPositions(currentPositions);
        architectureGraphRepository.save(graph);

        // Evict redis cache
        String cacheKey = String.format("arch:graph:%d:all", projectId);
        redisTemplate.delete(cacheKey);
    }

    @Override
    @Transactional
    public void resetNodePositions(Long projectId, Long userId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        ArchitectureGraph graph = architectureGraphRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("Graph not found", HttpStatus.NOT_FOUND));

        graph.setManualPositions(null);
        architectureGraphRepository.save(graph);

        // Evict redis cache
        String cacheKey = String.format("arch:graph:%d:all", projectId);
        redisTemplate.delete(cacheKey);
    }
}
