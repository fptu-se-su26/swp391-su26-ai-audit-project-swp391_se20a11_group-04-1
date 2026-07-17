package org.example.backend.repository;

import org.example.backend.entity.UseCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface
UseCaseRepository extends JpaRepository<UseCase, Long>, JpaSpecificationExecutor<UseCase> {
    
    @Query(value = "SELECT MAX(project_sub_id) FROM use_cases WHERE project_id = :projectId", nativeQuery = true)
    Integer findMaxProjectSubIdByProjectId(@Param("projectId") Long projectId);

    boolean existsByRequirementIdAndStatusNot(Long requirementId, org.example.backend.entity.UseCaseStatus status);
    boolean existsByIdAndProjectId(Long id, Long projectId);
    java.util.List<UseCase> findByProjectId(Long projectId);
    
    java.util.Optional<UseCase> findByProjectIdAndCode(Long projectId, String code);
    java.util.List<UseCase> findByRequirementId(Long requirementId);
    java.util.List<UseCase> findByRequirementIdIn(java.util.List<Long> requirementIds);
    long countByProjectId(Long projectId);
}
