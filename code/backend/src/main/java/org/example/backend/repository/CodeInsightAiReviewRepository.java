package org.example.backend.repository;

import org.example.backend.entity.CodeInsightAiReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodeInsightAiReviewRepository extends JpaRepository<CodeInsightAiReview, Long> {
    Optional<CodeInsightAiReview> findTopByTaskIdOrderByCreatedAtDesc(Long taskId);

    List<CodeInsightAiReview> findByTaskIdIn(List<Long> taskIds);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM CodeInsightAiReview r WHERE r.id IN (SELECT MAX(r2.id) FROM CodeInsightAiReview r2 WHERE r2.task.id IN :taskIds GROUP BY r2.task.id)")
    List<CodeInsightAiReview> findLatestReviewsForTasks(@org.springframework.data.repository.query.Param("taskIds") List<Long> taskIds);
}
