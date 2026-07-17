package org.example.backend.repository;

import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) AND p.createdAt >= :fromDate")
    Page<Project> findAuditLogs(@Param("search") String search, @Param("fromDate") java.time.LocalDateTime fromDate, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Project p WHERE p.isDeleted = false AND p.id = :projectId")
    Optional<Project> findByIdWithPessimisticWrite(@Param("projectId") Long projectId);

    @Query("SELECT p FROM Project p WHERE p.academicContext.id = :academicContextId AND p.isDeleted = false")
    java.util.List<Project> findByAcademicContextId(@Param("academicContextId") Long academicContextId);

    @Query(value = "SELECT * FROM projects WHERE is_deleted = false ORDER BY created_at DESC, id DESC LIMIT 5", nativeQuery = true)
    java.util.List<Project> findTop5ByOrderByCreatedAtDescIdDesc();

    long countByIsDeletedFalse();

    @Query("SELECT count(p) FROM Project p WHERE p.status = :status AND p.isDeleted = false")
    long countByStatus(@Param("status") ProjectStatus status);

    long countByStatusAndIsDeletedFalse(ProjectStatus status);

    long countByClosedAtIsNotNullAndIsDeletedFalse();

    long countByAcademicContextIsNotNullAndIsDeletedFalse();

    @Query("SELECT COUNT(p) FROM Project p " +
           "LEFT JOIN p.academicContext ac " +
           "LEFT JOIN ac.owner o " +
           "WHERE p.isDeleted = false " +
           "AND p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
           "AND (ac IS NULL OR o IS NULL OR o.id != :userId)")
    long countProjectsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(p) FROM Project p " +
           "LEFT JOIN p.academicContext ac " +
           "LEFT JOIN ac.owner o " +
           "WHERE p.isDeleted = false " +
           "AND p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
           "AND (ac IS NULL OR o IS NULL OR o.id != :userId) " +
           "AND p.status = :status")
    long countProjectsByUserIdAndStatus(@Param("userId") Long userId, @Param("status") ProjectStatus status);

    @Query("SELECT p FROM Project p WHERE p.academicContext.id = :academicContextId AND p.status != :status AND p.isDeleted = false")
    java.util.List<Project> findByAcademicContextIdAndStatusNot(@Param("academicContextId") Long academicContextId, @Param("status") ProjectStatus status);

    /**
     * Case 1: Lấy toàn bộ dự án của user (Không lọc trạng thái, không tìm kiếm).
     */
    @Query("SELECT p FROM Project p " +
           "LEFT JOIN p.academicContext ac " +
           "LEFT JOIN ac.owner o " +
           "WHERE p.isDeleted = false " +
           "AND p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
           "AND (ac IS NULL OR o IS NULL OR o.id != :userId)")
    Page<Project> findProjectsByUserId(
        @Param("userId") Long userId,
        Pageable pageable
    );

    /**
     * Case 2: Chỉ lọc theo trạng thái dự án.
     */
    @Query("SELECT p FROM Project p " +
           "LEFT JOIN p.academicContext ac " +
           "LEFT JOIN ac.owner o " +
           "WHERE p.isDeleted = false " +
           "AND p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
           "AND (ac IS NULL OR o IS NULL OR o.id != :userId) " +
           "AND p.status = :status")
    Page<Project> findProjectsByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("status") ProjectStatus status,
        Pageable pageable
    );

    /**
     * Case 3: Chỉ tìm kiếm theo từ khóa tên dự án.
     */
    @Query("SELECT p FROM Project p " +
           "LEFT JOIN p.academicContext ac " +
           "LEFT JOIN ac.owner o " +
           "WHERE p.isDeleted = false " +
           "AND p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
           "AND (ac IS NULL OR o IS NULL OR o.id != :userId) " +
           "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Project> findProjectsByUserIdAndSearch(
        @Param("userId") Long userId,
        @Param("search") String search,
        Pageable pageable
    );

    /**
     * Case 4: Lọc theo cả trạng thái và tìm kiếm theo từ khóa.
     */
    @Query("SELECT p FROM Project p " +
           "LEFT JOIN p.academicContext ac " +
           "LEFT JOIN ac.owner o " +
           "WHERE p.isDeleted = false " +
           "AND p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
           "AND (ac IS NULL OR o IS NULL OR o.id != :userId) " +
           "AND p.status = :status " +
           "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Project> findProjectsByUserIdAndStatusAndSearch(
        @Param("userId") Long userId,
        @Param("status") ProjectStatus status,
        @Param("search") String search,
        Pageable pageable
    );

    // ─────────────── Admin queries (6 variants to avoid PostgreSQL null-type-inference) ───────────────

    /** Admin Case 1: Chỉ tìm kiếm, không lọc status, không lọc suspended */
    @Query(value = "SELECT p FROM Project p " +
                   "LEFT JOIN FETCH p.createdBy u " +
                   "LEFT JOIN FETCH u.profile prof " +
                   "LEFT JOIN FETCH p.academicContext ac " +
                   "WHERE p.isDeleted = false " +
                   "AND (LOWER(p.name) LIKE :search " +
                   "     OR LOWER(u.username) LIKE :search " +
                   "     OR LOWER(prof.fullName) LIKE :search)",
           countQuery = "SELECT count(p) FROM Project p " +
                        "LEFT JOIN p.createdBy u " +
                        "LEFT JOIN u.profile prof " +
                        "WHERE p.isDeleted = false " +
                        "AND (LOWER(p.name) LIKE :search " +
                        "     OR LOWER(u.username) LIKE :search " +
                        "     OR LOWER(prof.fullName) LIKE :search)")
    Page<Project> findAllForAdmin(
        @Param("search") String search,
        Pageable pageable
    );

    /** Admin Case 2: Tìm kiếm + lọc theo status */
    @Query(value = "SELECT p FROM Project p " +
                   "LEFT JOIN FETCH p.createdBy u " +
                   "LEFT JOIN FETCH u.profile prof " +
                   "LEFT JOIN FETCH p.academicContext ac " +
                   "WHERE p.isDeleted = false " +
                   "AND (LOWER(p.name) LIKE :search " +
                   "     OR LOWER(u.username) LIKE :search " +
                   "     OR LOWER(prof.fullName) LIKE :search) " +
                   "AND p.status = :status",
           countQuery = "SELECT count(p) FROM Project p " +
                        "LEFT JOIN p.createdBy u " +
                        "LEFT JOIN u.profile prof " +
                        "WHERE p.isDeleted = false " +
                        "AND (LOWER(p.name) LIKE :search " +
                        "     OR LOWER(u.username) LIKE :search " +
                        "     OR LOWER(prof.fullName) LIKE :search) " +
                        "AND p.status = :status")
    Page<Project> findAllForAdminWithStatus(
        @Param("search") String search,
        @Param("status") ProjectStatus status,
        Pageable pageable
    );

    /** Admin Case 3: Tìm kiếm + lọc suspended = true (có closedAt) */
    @Query(value = "SELECT p FROM Project p " +
                   "LEFT JOIN FETCH p.createdBy u " +
                   "LEFT JOIN FETCH u.profile prof " +
                   "LEFT JOIN FETCH p.academicContext ac " +
                   "WHERE p.isDeleted = false " +
                   "AND (LOWER(p.name) LIKE :search " +
                   "     OR LOWER(u.username) LIKE :search " +
                   "     OR LOWER(prof.fullName) LIKE :search) " +
                   "AND p.closedAt IS NOT NULL",
           countQuery = "SELECT count(p) FROM Project p " +
                        "LEFT JOIN p.createdBy u " +
                        "LEFT JOIN u.profile prof " +
                        "WHERE p.isDeleted = false " +
                        "AND (LOWER(p.name) LIKE :search " +
                        "     OR LOWER(u.username) LIKE :search " +
                        "     OR LOWER(prof.fullName) LIKE :search) " +
                        "AND p.closedAt IS NOT NULL")
    Page<Project> findAllForAdminSuspended(
        @Param("search") String search,
        Pageable pageable
    );

    /** Admin Case 4: Tìm kiếm + lọc suspended = false (closedAt IS NULL) */
    @Query(value = "SELECT p FROM Project p " +
                   "LEFT JOIN FETCH p.createdBy u " +
                   "LEFT JOIN FETCH u.profile prof " +
                   "LEFT JOIN FETCH p.academicContext ac " +
                   "WHERE p.isDeleted = false " +
                   "AND (LOWER(p.name) LIKE :search " +
                   "     OR LOWER(u.username) LIKE :search " +
                   "     OR LOWER(prof.fullName) LIKE :search) " +
                   "AND p.closedAt IS NULL",
           countQuery = "SELECT count(p) FROM Project p " +
                        "LEFT JOIN p.createdBy u " +
                        "LEFT JOIN u.profile prof " +
                        "WHERE p.isDeleted = false " +
                        "AND (LOWER(p.name) LIKE :search " +
                        "     OR LOWER(u.username) LIKE :search " +
                        "     OR LOWER(prof.fullName) LIKE :search) " +
                        "AND p.closedAt IS NULL")
    Page<Project> findAllForAdminNotSuspended(
        @Param("search") String search,
        Pageable pageable
    );

    /** Admin Case 5: Tìm kiếm + status + suspended=true */
    @Query(value = "SELECT p FROM Project p " +
                   "LEFT JOIN FETCH p.createdBy u " +
                   "LEFT JOIN FETCH u.profile prof " +
                   "LEFT JOIN FETCH p.academicContext ac " +
                   "WHERE p.isDeleted = false " +
                   "AND (LOWER(p.name) LIKE :search " +
                   "     OR LOWER(u.username) LIKE :search " +
                   "     OR LOWER(prof.fullName) LIKE :search) " +
                   "AND p.status = :status " +
                   "AND p.closedAt IS NOT NULL",
           countQuery = "SELECT count(p) FROM Project p " +
                        "LEFT JOIN p.createdBy u " +
                        "LEFT JOIN u.profile prof " +
                        "WHERE p.isDeleted = false " +
                        "AND (LOWER(p.name) LIKE :search " +
                        "     OR LOWER(u.username) LIKE :search " +
                        "     OR LOWER(prof.fullName) LIKE :search) " +
                        "AND p.status = :status " +
                        "AND p.closedAt IS NOT NULL")
    Page<Project> findAllForAdminWithStatusSuspended(
        @Param("search") String search,
        @Param("status") ProjectStatus status,
        Pageable pageable
    );

    /** Admin Case 6: Tìm kiếm + status + suspended=false */
    @Query(value = "SELECT p FROM Project p " +
                   "LEFT JOIN FETCH p.createdBy u " +
                   "LEFT JOIN FETCH u.profile prof " +
                   "LEFT JOIN FETCH p.academicContext ac " +
                   "WHERE p.isDeleted = false " +
                   "AND (LOWER(p.name) LIKE :search " +
                   "     OR LOWER(u.username) LIKE :search " +
                   "     OR LOWER(prof.fullName) LIKE :search) " +
                   "AND p.status = :status " +
                   "AND p.closedAt IS NULL",
           countQuery = "SELECT count(p) FROM Project p " +
                        "LEFT JOIN p.createdBy u " +
                        "LEFT JOIN u.profile prof " +
                        "WHERE p.isDeleted = false " +
                        "AND (LOWER(p.name) LIKE :search " +
                        "     OR LOWER(u.username) LIKE :search " +
                        "     OR LOWER(prof.fullName) LIKE :search) " +
                        "AND p.status = :status " +
                        "AND p.closedAt IS NULL")
    Page<Project> findAllForAdminWithStatusNotSuspended(
        @Param("search") String search,
        @Param("status") ProjectStatus status,
        Pageable pageable
    );
}
