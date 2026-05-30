package org.example.backend.repository;

import org.example.backend.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {

    List<Sprint> findByProjectIdOrderByStartDateAscIdAsc(Long projectId);

    boolean existsByIdAndProjectId(Long id, Long projectId);

    /**
     * Tìm sprint overlap với khoảng ngày [weekStart, weekEnd].
     * Dùng cho WeeklyView để hiển thị SprintBanner.
     * Ưu tiên sprint ACTIVE, nếu không có thì lấy sprint gần nhất overlap.
     */
    @Query("SELECT s FROM Sprint s WHERE s.project.id = :projectId " +
           "AND s.startDate <= :weekEnd AND s.endDate >= :weekStart " +
           "ORDER BY CASE s.status WHEN 'ACTIVE' THEN 0 WHEN 'PLANNED' THEN 1 ELSE 2 END ASC, s.startDate DESC")
    List<Sprint> findSprintsOverlappingWeek(@Param("projectId") Long projectId,
                                             @Param("weekStart") LocalDate weekStart,
                                             @Param("weekEnd") LocalDate weekEnd);

    /** Tìm sprint ACTIVE của project */
    Optional<Sprint> findFirstByProjectIdAndStatus(Long projectId,
                                                    org.example.backend.entity.SprintStatus status);
}
