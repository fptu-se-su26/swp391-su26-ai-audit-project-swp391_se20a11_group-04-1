package org.example.backend.repository;

import org.example.backend.entity.UseCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface UseCaseRepository extends JpaRepository<UseCase, Long>, JpaSpecificationExecutor<UseCase> {
    boolean existsByRequirementIdAndStatusNot(Long requirementId, String status);
}
