package org.example.backend.repository;

import org.example.backend.entity.ProjectDiagram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectDiagramRepository extends JpaRepository<ProjectDiagram, Long> {
    Optional<ProjectDiagram> findFirstByProjectIdAndModuleIdOrderByUpdatedAtDesc(Long projectId, Long moduleId);
    Optional<ProjectDiagram> findFirstByProjectIdAndModuleIdIsNullOrderByUpdatedAtDesc(Long projectId);
}
