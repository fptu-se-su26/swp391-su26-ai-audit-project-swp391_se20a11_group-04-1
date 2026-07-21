package org.example.backend.repository;

import org.example.backend.entity.BusinessModule;
import org.example.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessModuleRepository extends JpaRepository<BusinessModule, Long> {
    List<BusinessModule> findByProject(Project project);
    List<BusinessModule> findByProjectId(Long projectId);
    List<BusinessModule> findByProjectOrderByCreatedAtAsc(Project project);
    boolean existsByProjectIdAndNameIgnoreCase(Long projectId, String name);
    boolean existsByProjectIdAndNameIgnoreCaseAndIdNot(Long projectId, String name, Long id);
}
