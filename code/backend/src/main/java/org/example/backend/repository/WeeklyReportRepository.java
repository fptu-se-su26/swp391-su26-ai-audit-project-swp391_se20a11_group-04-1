package org.example.backend.repository;

import org.example.backend.entity.WeeklyReport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, Long> {
    boolean existsByProjectIdAndReportWeekStartAndReportWeekEnd(Long projectId, LocalDate weekStart, LocalDate weekEnd);

    List<WeeklyReport> findByProjectIdAndReportWeekStartAndReportWeekEnd(Long projectId, LocalDate weekStart, LocalDate weekEnd);

    boolean existsByProjectIdAndSprintId(Long projectId, Long sprintId);

    List<WeeklyReport> findByProjectIdAndSprintIdOrderByGeneratedAtDesc(Long projectId, Long sprintId);

    List<WeeklyReport> findByProjectIdAndSprintId(Long projectId, Long sprintId);

    List<WeeklyReport> findByProjectIdOrderByReportWeekStartDesc(Long projectId);

    @EntityGraph(attributePaths = {"project", "sprint", "members", "members.user", "members.user.profile"})
    Optional<WeeklyReport> findWithMembersById(Long id);
}
