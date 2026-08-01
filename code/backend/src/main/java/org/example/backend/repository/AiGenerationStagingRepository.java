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
    
    java.util.Optional<AiGenerationStaging> findFirstByFileHashAndProjectIdAndStageOrderByCreatedAtDesc(String fileHash, Long projectId, AiStage stage);
    
    boolean existsByRequirementIdAndStatus(Long requirementId, AiGenerationStatus status);
    
    @Query("SELECT s FROM AiGenerationStaging s WHERE s.generationId = :generationId")
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    java.util.Optional<AiGenerationStaging> findByGenerationIdForUpdate(@org.springframework.data.repository.query.Param("generationId") UUID generationId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE AiGenerationStaging s SET s.status = :newStatus WHERE s.generationId = :generationId AND s.status = :expectedStatus")
    int updateStatusIf(@org.springframework.data.repository.query.Param("generationId") UUID generationId, @org.springframework.data.repository.query.Param("expectedStatus") AiGenerationStatus expectedStatus, @org.springframework.data.repository.query.Param("newStatus") AiGenerationStatus newStatus);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE AiGenerationStaging s SET s.status = :newStatus, s.payload = :payload, s.fileHash = :fileHash WHERE s.generationId = :generationId AND s.status = :expectedStatus")
    int updateStatusAndPayloadIf(@org.springframework.data.repository.query.Param("generationId") UUID generationId, @org.springframework.data.repository.query.Param("expectedStatus") AiGenerationStatus expectedStatus, @org.springframework.data.repository.query.Param("newStatus") AiGenerationStatus newStatus, @org.springframework.data.repository.query.Param("payload") com.fasterxml.jackson.databind.JsonNode payload, @org.springframework.data.repository.query.Param("fileHash") String fileHash);
}
