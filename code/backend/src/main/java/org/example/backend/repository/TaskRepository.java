package org.example.backend.repository;

import org.example.backend.entity.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    @EntityGraph(attributePaths = {"primaryAssignee", "checklist", "kanbanColumn"})
    List<Task> findByProjectIdOrderByUpdatedAtDesc(Long projectId);

    @EntityGraph(attributePaths = {"primaryAssignee", "checklist", "project", "kanbanColumn"})
    @Query("select t from Task t where t.id = :id")
    Optional<Task> findWithDetailsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"primaryAssignee", "checklist", "project", "kanbanColumn"})
    List<Task> findByPrimaryAssigneeIdOrderByUpdatedAtDesc(Long assigneeId);

    @EntityGraph(attributePaths = {"primaryAssignee", "project"})
    @Query("select t from Task t where t.primaryAssignee is not null")
    List<Task> findAllSlaCandidates();

    @EntityGraph(attributePaths = {"primaryAssignee", "checklist", "project"})
    List<Task> findByProjectIdAndSprintIdOrderBySprintPlanDateAscUpdatedAtDesc(Long projectId, Long sprintId);

    long countBySprintId(Long sprintId);

    // ── Daily View queries ────────────────────────────────────────────────────

    /** Task quá hạn: deadline < date AND status != DONE AND != BLOCKED */
    @EntityGraph(attributePaths = {"primaryAssignee", "primaryAssignee.profile"})
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId " +
           "AND t.deadline < :date AND t.status <> 'DONE' AND t.status <> 'BLOCKED'")
    List<Task> findOverdueTasks(@Param("projectId") Long projectId,
                                @Param("date") LocalDate date);

    /** Task BLOCKED trong project tính đến ngày date */
    @EntityGraph(attributePaths = {"primaryAssignee", "primaryAssignee.profile"})
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.status = 'BLOCKED' " +
           "AND (COALESCE(t.startDate, t.deadline) <= :date)")
    List<Task> findBlockedTasks(@Param("projectId") Long projectId, @Param("date") LocalDate date);

    /** Task đến hạn đúng ngày date và chưa done */
    @EntityGraph(attributePaths = {"primaryAssignee", "primaryAssignee.profile"})
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId " +
           "AND t.deadline = :date AND t.status <> 'DONE'")
    List<Task> findDueTasks(@Param("projectId") Long projectId,
                            @Param("date") LocalDate date);

    /** Task đang diễn ra (startDate <= date AND deadline > date AND chưa hoàn thành/blocked) */
    @EntityGraph(attributePaths = {"primaryAssignee", "primaryAssignee.profile"})
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId " +
           "AND t.startDate <= :date AND t.deadline > :date AND t.status <> 'DONE' AND t.status <> 'BLOCKED'")
    List<Task> findOngoingTasks(@Param("projectId") Long projectId,
                                @Param("date") LocalDate date);

    /** Task hoàn thành trong ngày date (dựa trên completedAt) */
    @EntityGraph(attributePaths = {"primaryAssignee", "primaryAssignee.profile"})
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId " +
           "AND t.status = 'DONE' " +
           "AND t.completedAt >= :startOfDay AND t.completedAt < :endOfDay")
    List<Task> findDoneTasksOnDate(@Param("projectId") Long projectId,
                                   @Param("startOfDay") LocalDateTime startOfDay,
                                   @Param("endOfDay") LocalDateTime endOfDay);

    /** Đếm task IN_PROGRESS trong project */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId AND t.status = 'IN_PROGRESS'")
    int countInProgressTasks(@Param("projectId") Long projectId);

    // ── Weekly View queries ───────────────────────────────────────────────────

    /** Tất cả task có deadline hoặc thời gian diễn ra giao với khoảng [weekStart, weekEnd] */
    @EntityGraph(attributePaths = {"primaryAssignee", "primaryAssignee.profile"})
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId " +
           "AND ( (t.startDate IS NULL AND t.deadline >= :weekStart AND t.deadline <= :weekEnd) " +
           "   OR (t.startDate IS NOT NULL AND t.startDate <= :weekEnd AND t.deadline >= :weekStart) ) " +
           "ORDER BY t.deadline ASC, t.priority ASC")
    List<Task> findTasksInWeek(@Param("projectId") Long projectId,
                               @Param("weekStart") LocalDate weekStart,
                               @Param("weekEnd") LocalDate weekEnd);

    /** Task done trong khoảng thời gian (dùng cho daily completion chart) */
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId " +
           "AND t.status = 'DONE' " +
           "AND t.completedAt >= :startOfDay AND t.completedAt < :endOfDay")
    List<Task> findDoneTasksBetween(@Param("projectId") Long projectId,
                                    @Param("startOfDay") LocalDateTime startOfDay,
                                    @Param("endOfDay") LocalDateTime endOfDay);

    /** Tất cả task trong sprint (dùng cho sprint progress) */
    @EntityGraph(attributePaths = {"primaryAssignee", "primaryAssignee.profile"})
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.sprintId = :sprintId")
    List<Task> findByProjectIdAndSprintId(@Param("projectId") Long projectId,
                                          @Param("sprintId") Long sprintId);

    /** Tất cả task trong project có assignee (dùng cho team workload) */
    @EntityGraph(attributePaths = {"primaryAssignee", "primaryAssignee.profile"})
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.primaryAssignee IS NOT NULL")
    List<Task> findAllWithAssigneeByProjectId(@Param("projectId") Long projectId);
}
