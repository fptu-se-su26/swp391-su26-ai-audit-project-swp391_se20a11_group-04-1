package org.example.backend.repository;

import org.example.backend.entity.SchedulerRunLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SchedulerRunLogRepository extends JpaRepository<SchedulerRunLog, Long> {
    Optional<SchedulerRunLog> findTopByJobNameOrderByStartedAtDesc(String jobName);
}
