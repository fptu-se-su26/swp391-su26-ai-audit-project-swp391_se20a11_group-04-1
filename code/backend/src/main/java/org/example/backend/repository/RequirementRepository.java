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
}
