package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.AiGenerationStaging;
import org.example.backend.entity.AiGenerationStatus;
import org.example.backend.entity.AiStage;
import org.example.backend.entity.Project;
import org.example.backend.repository.AiGenerationStagingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiGenerationStagingService {

    private final AiGenerationStagingRepository stagingRepository;

    @Transactional
    public AiGenerationStaging createProcessing(Project project, UUID generationId, AiStage stage, JsonNode payload) {
        AiGenerationStaging staging = AiGenerationStaging.builder()
                .project(project)
                .generationId(generationId)
                .stage(stage)
                .payload(payload)
                .status(AiGenerationStatus.PROCESSING)
                .build();
        return stagingRepository.save(staging);
    }

    @Transactional(readOnly = true)
    public boolean isStillProcessing(UUID generationId) {
        List<AiGenerationStaging> stagings = stagingRepository.findByGenerationId(generationId);
        if (stagings.isEmpty()) {
            return false;
        }
        return stagings.get(0).getStatus() == AiGenerationStatus.PROCESSING;
    }

    @Transactional
    public boolean completeIfProcessing(UUID generationId, JsonNode payload, String fileHash) {
        int updatedCount = stagingRepository.updateStatusAndPayloadIf(
                generationId,
                AiGenerationStatus.PROCESSING,
                AiGenerationStatus.PENDING,
                payload,
                fileHash
        );
        return updatedCount > 0;
    }

    @Transactional
    public boolean failIfProcessing(UUID generationId, JsonNode errorPayload) {
        int updatedCount = stagingRepository.updateStatusAndPayloadIf(
                generationId,
                AiGenerationStatus.PROCESSING,
                AiGenerationStatus.DISCARDED,
                errorPayload,
                null
        );
        return updatedCount > 0;
    }

    @Transactional
    public boolean cancelIfProcessing(UUID generationId) {
        int updatedCount = stagingRepository.updateStatusIf(
                generationId,
                AiGenerationStatus.PROCESSING,
                AiGenerationStatus.DISCARDED
        );
        return updatedCount > 0;
    }

    @Transactional
    public boolean updateStatusAndPayloadIf(UUID generationId, AiGenerationStatus currentStatus, AiGenerationStatus newStatus, JsonNode payload, String fileHash) {
        int updatedCount = stagingRepository.updateStatusAndPayloadIf(
                generationId,
                currentStatus,
                newStatus,
                payload,
                fileHash
        );
        return updatedCount > 0;
    }

    @Transactional
    public AiGenerationStaging findAndLockForUpdate(UUID generationId) {
        return stagingRepository.findByGenerationIdForUpdate(generationId)
                .orElseThrow(() -> new RuntimeException("Staging not found"));
    }
}
