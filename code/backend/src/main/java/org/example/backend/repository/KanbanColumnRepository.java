package org.example.backend.repository;

import org.example.backend.entity.KanbanColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KanbanColumnRepository extends JpaRepository<KanbanColumn, Long> {
    List<KanbanColumn> findByProjectIdAndArchivedFalseOrderByColumnOrderAscIdAsc(Long projectId);
    List<KanbanColumn> findByProjectIdOrderByColumnOrderAscIdAsc(Long projectId);
    Optional<KanbanColumn> findByProjectIdAndStatusKey(Long projectId, String statusKey);
    Optional<KanbanColumn> findByProjectIdAndNameIgnoreCase(Long projectId, String name);
    int countByProjectId(Long projectId);
}
