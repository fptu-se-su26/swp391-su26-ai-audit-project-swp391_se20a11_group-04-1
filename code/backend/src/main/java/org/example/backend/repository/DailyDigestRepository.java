package org.example.backend.repository;

import org.example.backend.entity.DailyDigest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyDigestRepository extends JpaRepository<DailyDigest, Long> {
    boolean existsByUserIdAndDigestDateAndDigestType(Long userId, LocalDate digestDate, String digestType);

    Optional<DailyDigest> findByUserIdAndDigestDateAndDigestType(Long userId, LocalDate digestDate, String digestType);

    @EntityGraph(attributePaths = {"user", "items"})
    List<DailyDigest> findByStatusOrderByCreatedAtAsc(String status);
}
