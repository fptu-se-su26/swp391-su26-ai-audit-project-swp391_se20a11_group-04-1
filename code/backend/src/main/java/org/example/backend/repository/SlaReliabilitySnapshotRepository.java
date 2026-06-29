package org.example.backend.repository;

import org.example.backend.entity.SlaReliabilitySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SlaReliabilitySnapshotRepository extends JpaRepository<SlaReliabilitySnapshot, Long> {

    Optional<SlaReliabilitySnapshot> findByProjectIdAndSprintId(Long projectId, Long sprintId);

    void deleteByProjectIdAndSprintId(Long projectId, Long sprintId);

    List<SlaReliabilitySnapshot> findByProjectIdOrderByComputedAtDesc(Long projectId);
}
