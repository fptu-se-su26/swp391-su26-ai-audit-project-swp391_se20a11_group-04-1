package org.example.backend.repository;

import org.example.backend.entity.BusinessModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessModuleRepository extends JpaRepository<BusinessModule, Long> {
    List<BusinessModule> findByProjectId(Long projectId);
}
