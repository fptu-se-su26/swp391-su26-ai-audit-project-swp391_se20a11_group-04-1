package org.example.backend.repository;

import org.example.backend.entity.EvidenceLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EvidenceLinkRepository extends JpaRepository<EvidenceLink, Long> {
}
