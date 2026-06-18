package org.example.backend.repository;

import org.example.backend.entity.TaskReviewSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskReviewSnapshotRepository extends JpaRepository<TaskReviewSnapshot, Long> {
}
