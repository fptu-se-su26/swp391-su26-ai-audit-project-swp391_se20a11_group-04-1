package org.example.backend.repository;

import org.example.backend.entity.SyncStatusEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface SyncStatusRepository extends JpaRepository<SyncStatusEntry, SyncStatusEntry.SyncStatusId> {

    Optional<SyncStatusEntry> findByEntityTypeAndEntityId(String entityType, Long entityId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO sync_status (entity_type, entity_id, last_synced_at, sync_version, is_stale) " +
                   "VALUES (:entityType, :entityId, :lastSyncedAt, 1, false) " +
                   "ON CONFLICT (entity_type, entity_id) DO UPDATE SET " +
                   "last_synced_at = EXCLUDED.last_synced_at, " +
                   "sync_version = sync_status.sync_version + 1, " +
                   "is_stale = false", nativeQuery = true)
    void upsert(@Param("entityType") String entityType, 
                @Param("entityId") Long entityId, 
                @Param("lastSyncedAt") LocalDateTime lastSyncedAt);
}
