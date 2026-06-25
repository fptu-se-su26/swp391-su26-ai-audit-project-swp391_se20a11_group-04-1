package org.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "sync_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(SyncStatusEntry.SyncStatusId.class)
public class SyncStatusEntry {

    @Id
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Id
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column(name = "sync_version", nullable = false)
    private Long syncVersion;

    @Column(name = "is_stale", nullable = false)
    private Boolean isStale;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SyncStatusId implements Serializable {
        private String entityType;
        private Long entityId;
    }
}
