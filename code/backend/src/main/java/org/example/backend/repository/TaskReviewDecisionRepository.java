package org.example.backend.repository;

import org.example.backend.entity.TaskReviewDecision;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskReviewDecisionRepository extends JpaRepository<TaskReviewDecision, Long> {

    // Used for project-level review history screens or reports with enough data to render names.
    @EntityGraph(attributePaths = {"task", "task.primaryAssignee", "reviewer", "reviewer.profile"})
    List<TaskReviewDecision> findByTaskProjectIdOrderByCreatedAtDesc(Long projectId);

    // Used by the review queue to show the latest request/reject/approve reason for a task.
    Optional<TaskReviewDecision> findTopByTaskIdOrderByCreatedAtDesc(Long taskId);

    @EntityGraph(attributePaths = {"task", "task.primaryAssignee", "reviewer", "reviewer.profile"})
    List<TaskReviewDecision> findByTaskIdOrderByCreatedAtDesc(Long taskId);
}
