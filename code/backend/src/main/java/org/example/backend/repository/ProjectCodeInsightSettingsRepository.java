package org.example.backend.repository;

import org.example.backend.entity.ProjectCodeInsightSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectCodeInsightSettingsRepository extends JpaRepository<ProjectCodeInsightSettings, Long> {
    Optional<ProjectCodeInsightSettings> findByProjectId(Long projectId);
}
