package org.example.backend.repository;

import org.example.backend.entity.ApiEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiEnvironmentRepository extends JpaRepository<ApiEnvironment, Long> {
    List<ApiEnvironment> findByProjectId(Long projectId);
    Optional<ApiEnvironment> findByIdAndProjectId(Long id, Long projectId);
}
