package org.example.backend.repository;

import org.example.backend.entity.EvidenceLink;
import org.example.backend.entity.EvidenceEntityType;
import org.example.backend.entity.EvidenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceLinkRepository extends JpaRepository<EvidenceLink, Long> {
    @Query("""
            select count(el) > 0
            from EvidenceLink el
            where el.entityType = :entityType
              and el.entityId = :entityId
              and el.evidence.status = :status
            """)
    boolean existsAcceptedEvidenceForEntity(@Param("entityType") EvidenceEntityType entityType,
                                            @Param("entityId") Long entityId,
                                            @Param("status") EvidenceStatus status);

    @Query("""
            select distinct el.entityId
            from EvidenceLink el
            where el.entityType = :entityType
              and el.entityId in :entityIds
              and el.evidence.status = :status
            """)
    List<Long> findEntityIdsWithAcceptedEvidence(@Param("entityType") EvidenceEntityType entityType,
                                                 @Param("entityIds") List<Long> entityIds,
                                                 @Param("status") EvidenceStatus status);
}
