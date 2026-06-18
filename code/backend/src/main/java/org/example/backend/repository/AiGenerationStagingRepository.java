package org.example.backend.repository;

import org.example.backend.entity.AiGenerationStaging;
import org.example.backend.entity.AiStage;
import org.example.backend.entity.AiGenerationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiGenerationStagingRepository extends JpaRepository<AiGenerationStaging, Long> {
    List<AiGenerationStaging> findByProjectIdAndStageAndStatusOrderByCreatedAtDesc(Long projectId, AiStage stage, AiGenerationStatus status);
    List<AiGenerationStaging> findByGenerationId(UUID generationId);
    java.util.Optional<AiGenerationStaging> findFirstByFileHashOrderByCreatedAtDesc(String fileHash);
}
