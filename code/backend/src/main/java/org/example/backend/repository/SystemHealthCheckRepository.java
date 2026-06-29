package org.example.backend.repository;

import org.example.backend.entity.SystemHealthCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SystemHealthCheckRepository extends JpaRepository<SystemHealthCheck, Long> {
    List<SystemHealthCheck> findTop1ByComponentOrderByCheckedAtDesc(String component);
    List<SystemHealthCheck> findByCheckedAtAfterOrderByCheckedAtDesc(LocalDateTime after);
}
