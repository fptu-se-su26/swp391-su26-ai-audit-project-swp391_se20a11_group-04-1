package org.example.backend.repository;

import org.example.backend.entity.Sprint;
import org.example.backend.entity.SprintStatus;
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

    Optional<Sprint> findByIdAndProjectId(Long id, Long projectId);

    @Query("""
            select count(s) > 0
            from Sprint s
            where s.project.id = :projectId
              and (:excludeSprintId is null or s.id <> :excludeSprintId)
              and s.startDate <= :endDate
              and s.endDate >= :startDate
            """)
    boolean existsOverlappingSprint(
            @Param("projectId") Long projectId,
            @Param("excludeSprintId") Long excludeSprintId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            select count(s) > 0
            from Sprint s
            where s.project.id = :projectId
              and s.status = :status
              and (:excludeSprintId is null or s.id <> :excludeSprintId)
            """)
    boolean existsByProjectIdAndStatusExcludingId(
            @Param("projectId") Long projectId,
            @Param("status") SprintStatus status,
            @Param("excludeSprintId") Long excludeSprintId
    );
}
