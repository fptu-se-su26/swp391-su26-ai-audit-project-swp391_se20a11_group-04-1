package org.example.backend.repository;

import org.example.backend.entity.TaskPenaltyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskPenaltyLogRepository extends JpaRepository<TaskPenaltyLog, Long> {
    boolean existsByTaskIdAndReason(Long taskId, String reason);
}
