package org.example.backend.repository;

import org.example.backend.entity.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByProjectIdOrderByStartDateAscIdAsc(Long projectId);

    boolean existsByIdAndProjectId(Long id, Long projectId);

    Optional<Sprint> findByIdAndProjectId(Long id, Long projectId);
}
