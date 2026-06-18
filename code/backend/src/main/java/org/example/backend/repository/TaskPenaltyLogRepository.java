package org.example.backend.repository;

import org.example.backend.entity.TaskPenaltyLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskPenaltyLogRepository extends JpaRepository<TaskPenaltyLog, Long> {
    boolean existsByTaskIdAndReason(Long taskId, String reason);

    @Query("SELECT COUNT(tpl) FROM TaskPenaltyLog tpl WHERE tpl.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}
