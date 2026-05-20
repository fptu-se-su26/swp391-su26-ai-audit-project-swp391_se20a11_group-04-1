package org.example.backend.repository;

import org.example.backend.entity.RequirementTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequirementTagRepository extends JpaRepository<RequirementTag, Long> {
}
