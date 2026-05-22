package org.example.backend.repository;

import org.example.backend.entity.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    @EntityGraph(attributePaths = {"primaryAssignee", "checklist"})
    List<Task> findByProjectIdOrderByUpdatedAtDesc(Long projectId);

    @EntityGraph(attributePaths = {"primaryAssignee", "checklist", "project"})
    @Query("select t from Task t where t.id = :id")
    Optional<Task> findWithDetailsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"primaryAssignee", "checklist", "project"})
    List<Task> findByPrimaryAssigneeIdOrderByUpdatedAtDesc(Long assigneeId);
}
