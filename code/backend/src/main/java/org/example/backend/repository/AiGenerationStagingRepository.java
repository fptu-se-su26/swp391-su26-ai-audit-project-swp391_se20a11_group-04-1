package org.example.backend.repository;

import org.example.backend.entity.AiGenerationStaging;
import org.example.backend.entity.AiStage;
import org.example.backend.entity.AiGenerationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiGenerationStagingRepository extends JpaRepository<AiGenerationStaging, Long> {
    List<AiGenerationStaging> findByProjectIdAndStageAndStatusOrderByCreatedAtDesc(Long projectId, AiStage stage, AiGenerationStatus status);
    List<AiGenerationStaging> findByGenerationId(UUID generationId);
    @Query(value = "SELECT * FROM ai_generation_staging WHERE stage = 'TEST_CASE' AND project_id = :projectId AND requirement_id = :reqId ORDER BY created_at DESC LIMIT 10", nativeQuery = true)
    List<AiGenerationStaging> findRecentByRequirementId(@org.springframework.data.repository.query.Param("projectId") Long projectId, @org.springframework.data.repository.query.Param("reqId") Long reqId);
    
    java.util.Optional<AiGenerationStaging> findFirstByFileHashOrderByCreatedAtDesc(String fileHash);
}
