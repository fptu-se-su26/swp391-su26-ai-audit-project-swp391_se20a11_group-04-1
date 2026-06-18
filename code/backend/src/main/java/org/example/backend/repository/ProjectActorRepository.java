package org.example.backend.repository;

import org.example.backend.entity.ProjectActor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectActorRepository extends JpaRepository<ProjectActor, Long> {
    List<ProjectActor> findByProjectId(Long projectId);
}
