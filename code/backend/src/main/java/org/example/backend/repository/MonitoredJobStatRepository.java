package org.example.backend.repository;

import org.example.backend.entity.MonitoredJobStat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MonitoredJobStatRepository extends JpaRepository<MonitoredJobStat, Long> {
    List<MonitoredJobStat> findTop10ByJobNameOrderByExecutedAtDesc(String jobName);
    List<MonitoredJobStat> findTop1ByJobNameOrderByExecutedAtDesc(String jobName);
    int countByJobNameAndStatusAndExecutedAtAfter(String jobName, String status, LocalDateTime after);
    Page<MonitoredJobStat> findByJobName(String jobName, Pageable pageable);
}
