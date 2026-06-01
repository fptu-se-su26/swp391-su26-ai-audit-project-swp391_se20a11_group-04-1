package org.example.backend.repository;

import org.example.backend.entity.TaskReviewDecision;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskReviewDecisionRepository extends JpaRepository<TaskReviewDecision, Long> {

    @EntityGraph(attributePaths = {"task", "task.primaryAssignee", "reviewer", "reviewer.profile"})
    List<TaskReviewDecision> findByTaskProjectIdOrderByCreatedAtDesc(Long projectId);

    Optional<TaskReviewDecision> findTopByTaskIdOrderByCreatedAtDesc(Long taskId);
}
