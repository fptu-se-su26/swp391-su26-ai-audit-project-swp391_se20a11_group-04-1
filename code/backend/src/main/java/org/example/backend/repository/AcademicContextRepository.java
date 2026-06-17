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
    
    @Query("SELECT ac FROM AcademicContext ac WHERE ac.owner.id = :ownerId")
    Page<AcademicContext> findByOwnerId(Long ownerId, Pageable pageable);

    @Query("SELECT ac FROM AcademicContext ac WHERE ac.owner.id = :ownerId AND (:semester IS NULL OR ac.semester = :semester) AND LOWER(ac.subject) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<AcademicContext> findByOwnerIdWithFilters(Long ownerId, AcademicSeason semester, String search, Pageable pageable);

    Optional<AcademicContext> findBySubjectAndSemesterAndAcademicYear(String subject, AcademicSeason semester, String academicYear);
}
