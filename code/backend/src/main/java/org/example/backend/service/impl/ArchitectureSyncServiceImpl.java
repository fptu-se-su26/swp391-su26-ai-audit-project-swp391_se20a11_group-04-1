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
    public ArchitectureGraph getGraphData(Long projectId, String layer, String nodeId, Long userId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        String cacheKey = String.format("arch:graph:%d:%s:%s", projectId, layer, (nodeId != null ? nodeId : "ALL"));
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

        ArchitectureGraph filteredGraph = filterGraphForLayer(fullGraph, layer, nodeId);

        try {
            redisTemplate.opsForValue().set(
                    cacheKey, 
                    objectMapper.writeValueAsString(filteredGraph), 
                    12, 
                    TimeUnit.HOURS
            );
        } catch (Exception e) {
            log.error("Failed to cache filtered graph to Redis", e);
        }

        return filteredGraph;
    }

    private ArchitectureGraph filterGraphForLayer(ArchitectureGraph fullGraph, String layer, String nodeId) {
        if (fullGraph == null) return null;
        
        List<GraphNode> allNodes = fullGraph.getNodes();
        List<GraphEdge> allEdges = fullGraph.getEdges();
        
        List<GraphNode> filteredNodes = new ArrayList<>();
        List<GraphEdge> filteredEdges = new ArrayList<>();
        
        if ("OVERVIEW".equalsIgnoreCase(layer)) {
            for (GraphNode node : allNodes) {
                if ("OVERVIEW".equalsIgnoreCase(node.getLayer())) {
                    filteredNodes.add(node);
                }
            }
            for (GraphEdge edge : allEdges) {
                if ("OVERVIEW".equalsIgnoreCase(edge.getLayer())) {
                    filteredEdges.add(edge);
                }
            }
        } 
        else if ("MODULE".equalsIgnoreCase(layer)) {
            if (nodeId == null || nodeId.trim().isEmpty() || "ALL".equalsIgnoreCase(nodeId)) {
                for (GraphNode node : allNodes) {
                    if ("MODULE".equalsIgnoreCase(node.getLayer())) {
                        filteredNodes.add(node);
                    }
                }
                for (GraphEdge edge : allEdges) {
                    if ("MODULE".equalsIgnoreCase(edge.getLayer())) {
                        filteredEdges.add(edge);
                    }
                }
            } else {
                Set<String> moduleNodeIds = new HashSet<>();
                for (GraphNode node : allNodes) {
                    if ("MODULE".equalsIgnoreCase(node.getLayer()) && nodeId.equals(node.getParentId())) {
                        filteredNodes.add(node);
                        moduleNodeIds.add(node.getNodeId());
                    }
                }
                for (GraphEdge edge : allEdges) {
                    if ("MODULE".equalsIgnoreCase(edge.getLayer()) && 
                        (moduleNodeIds.contains(edge.getSource()) || moduleNodeIds.contains(edge.getTarget()))) {
                        filteredEdges.add(edge);
                    }
                }
            }
        } 
        else if ("FLOW".equalsIgnoreCase(layer)) {
            if (nodeId == null || nodeId.trim().isEmpty() || "ALL".equalsIgnoreCase(nodeId)) {
                for (GraphNode node : allNodes) {
                    if (("CLASS".equals(node.getType()) || "INTERFACE".equals(node.getType())) && "MODULE".equals(node.getLayer())) {
                        nodeId = node.getNodeId();
                        break;
                    }
                }
            }
            
            if (nodeId != null) {
                Set<String> classIdsToInclude = new HashSet<>();
                Set<String> methodIdsToInclude = new HashSet<>();
                
                classIdsToInclude.add(nodeId);
                
                for (GraphNode node : allNodes) {
                    if ("METHOD".equals(node.getType()) && nodeId.equals(node.getParentId())) {
                        methodIdsToInclude.add(node.getNodeId());
                    }
                }
                
                List<GraphEdge> callsEdges = new ArrayList<>();
                for (GraphEdge edge : allEdges) {
                    if ("FLOW".equalsIgnoreCase(edge.getLayer()) && "CALLS".equals(edge.getType())) {
                        if (methodIdsToInclude.contains(edge.getSource()) || methodIdsToInclude.contains(edge.getTarget())) {
                            callsEdges.add(edge);
                            methodIdsToInclude.add(edge.getSource());
                            methodIdsToInclude.add(edge.getTarget());
                        }
                    }
                }
                filteredEdges.addAll(callsEdges);
                
                Map<String, GraphNode> allNodeMap = new HashMap<>();
                for (GraphNode node : allNodes) {
                    allNodeMap.put(node.getNodeId(), node);
                }
                
                for (String mid : methodIdsToInclude) {
                    GraphNode mNode = allNodeMap.get(mid);
                    if (mNode != null && mNode.getParentId() != null) {
                        classIdsToInclude.add(mNode.getParentId());
                    }
                }
                
                for (String cid : classIdsToInclude) {
                    GraphNode cNode = allNodeMap.get(cid);
                    if (cNode != null) {
                        filteredNodes.add(cNode);
                    }
                }
                for (String mid : methodIdsToInclude) {
                    GraphNode mNode = allNodeMap.get(mid);
                    if (mNode != null) {
                        filteredNodes.add(mNode);
                    }
                }
                
                for (GraphEdge edge : allEdges) {
                    if ("CONTAINS".equals(edge.getType()) && 
                        classIdsToInclude.contains(edge.getSource()) && 
                        methodIdsToInclude.contains(edge.getTarget())) {
                        filteredEdges.add(edge);
                    }
                }
            }
        }
        
        return ArchitectureGraph.builder()
                .id(fullGraph.getId())
                .projectId(fullGraph.getProjectId())
                .syncedAt(fullGraph.getSyncedAt())
                .commitSha(fullGraph.getCommitSha())
                .branch(fullGraph.getBranch())
                .stats(fullGraph.getStats())
                .nodes(filteredNodes)
                .edges(filteredEdges)
                .build();
    }
}
