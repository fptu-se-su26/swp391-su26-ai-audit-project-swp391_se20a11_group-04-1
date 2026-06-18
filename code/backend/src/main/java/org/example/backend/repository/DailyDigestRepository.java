package org.example.backend.repository;

import org.example.backend.entity.DailyDigest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyDigestRepository extends JpaRepository<DailyDigest, Long> {
    boolean existsByUserIdAndDigestDateAndDigestType(Long userId, LocalDate digestDate, String digestType);

    boolean existsByUserIdAndProjectIdAndDigestDateAndDigestType(Long userId, Long projectId, LocalDate digestDate, String digestType);

    Optional<DailyDigest> findByUserIdAndDigestDateAndDigestType(Long userId, LocalDate digestDate, String digestType);

    Optional<DailyDigest> findByUserIdAndProjectIdAndDigestDateAndDigestType(Long userId, Long projectId, LocalDate digestDate, String digestType);

    @EntityGraph(attributePaths = {"user", "items"})
    List<DailyDigest> findByStatusOrderByCreatedAtAsc(String status);

    @EntityGraph(attributePaths = {"user", "items"})
    List<DailyDigest> findByDigestDateAndStatusInOrderByCreatedAtAsc(LocalDate digestDate, Collection<String> statuses);

    @EntityGraph(attributePaths = {"user", "items"})
    List<DailyDigest> findByProjectIdAndStatusOrderByCreatedAtAsc(Long projectId, String status);

    @EntityGraph(attributePaths = {"user", "items"})
    List<DailyDigest> findByProjectIdAndDigestDateAndStatusInOrderByCreatedAtAsc(Long projectId, LocalDate digestDate, Collection<String> statuses);
}
