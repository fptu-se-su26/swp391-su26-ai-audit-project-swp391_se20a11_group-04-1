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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Project p WHERE p.id = :projectId")
    Optional<Project> findByIdWithPessimisticWrite(@Param("projectId") Long projectId);

    /**
     * Case 1: Lấy toàn bộ dự án (Không lọc trạng thái, không tìm kiếm).
     */
    @Query("SELECT p FROM Project p " +
           "WHERE p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId)")
    Page<Project> findProjectsByUserId(
        @Param("userId") Long userId, 
        Pageable pageable
    );

    /**
     * Case 2: Chỉ lọc theo trạng thái dự án.
     */
    @Query("SELECT p FROM Project p " +
           "WHERE p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
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
           "WHERE p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
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
           "WHERE p.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId) " +
           "AND p.status = :status " +
           "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Project> findProjectsByUserIdAndStatusAndSearch(
        @Param("userId") Long userId, 
        @Param("status") ProjectStatus status, 
        @Param("search") String search, 
        Pageable pageable
    );
}
