package org.example.backend.repository;

import org.example.backend.entity.SchedulerRunLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SchedulerRunLogRepository extends JpaRepository<SchedulerRunLog, Long> {
}
