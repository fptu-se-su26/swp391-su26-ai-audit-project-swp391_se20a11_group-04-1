package org.example.backend.repository;

import org.example.backend.entity.SchedulerRunLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SchedulerRunLogRepository extends JpaRepository<SchedulerRunLog, Long> {
    Page<SchedulerRunLog> findAllByOrderByStartedAtDesc(Pageable pageable);
    Page<SchedulerRunLog> findByJobNameOrderByStartedAtDesc(String jobName, Pageable pageable);
}
