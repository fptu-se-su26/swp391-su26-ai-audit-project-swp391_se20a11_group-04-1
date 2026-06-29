package org.example.backend.repository;

import org.example.backend.entity.SprintCompletionSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SprintCompletionSummaryRepository extends JpaRepository<SprintCompletionSummary, Long> {
    Optional<SprintCompletionSummary> findBySprintId(Long sprintId);
}
