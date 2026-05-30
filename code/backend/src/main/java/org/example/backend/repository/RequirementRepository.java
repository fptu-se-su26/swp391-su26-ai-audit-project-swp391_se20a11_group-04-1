package org.example.backend.repository;

import org.example.backend.entity.Requirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface RequirementRepository extends JpaRepository<Requirement, Long>, JpaSpecificationExecutor<Requirement> {

    @Query(value = "SELECT MAX(project_sub_id) FROM requirements WHERE project_id = :projectId", nativeQuery = true)
    Integer findMaxProjectSubIdByProjectId(@Param("projectId") Long projectId);

    boolean existsByIdAndProjectId(Long id, Long projectId);

    /** Đếm tổng số requirement trong project (dùng cho RTM coverage) */
    long countByProjectId(Long projectId);

    /**
     * Đếm số requirement có ít nhất 1 task liên kết (dùng cho RTM coverage %).
     */
    @Query(value = "SELECT COUNT(DISTINCT r.id) FROM requirements r " +
                   "WHERE r.project_id = :projectId " +
                   "AND r.is_deleted = false " +
                   "AND EXISTS (SELECT 1 FROM tasks t WHERE t.requirement_id = r.id)",
           nativeQuery = true)
    long countRequirementsWithTasksByProjectId(@Param("projectId") Long projectId);
}
