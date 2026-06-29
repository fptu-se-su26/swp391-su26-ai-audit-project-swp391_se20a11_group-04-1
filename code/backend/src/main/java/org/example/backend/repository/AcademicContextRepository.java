package org.example.backend.repository;

import org.example.backend.entity.AcademicContext;
import org.example.backend.entity.AcademicSeason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicContextRepository extends JpaRepository<AcademicContext, Long> {
    @Query("SELECT DISTINCT ac FROM AcademicContext ac LEFT JOIN ac.enrolledStudents es WHERE (ac.owner.id = :userId OR es.id = :userId)")
    Page<AcademicContext> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT DISTINCT ac FROM AcademicContext ac LEFT JOIN ac.enrolledStudents es WHERE (ac.owner.id = :userId OR es.id = :userId) AND (:semester IS NULL OR ac.semester = :semester) AND LOWER(ac.subject) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<AcademicContext> findByUserIdWithFilters(Long userId, AcademicSeason semester, String search, Pageable pageable);

    Optional<AcademicContext> findBySubjectAndSemesterAndAcademicYear(String subject, AcademicSeason semester, String academicYear);

    long countByOwnerId(Long ownerId);
}
