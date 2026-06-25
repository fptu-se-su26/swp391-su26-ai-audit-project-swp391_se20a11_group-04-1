package org.example.backend.repository;

import org.example.backend.entity.ProcessedEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, String> {
    
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM processed_events WHERE processed_at < NOW() - INTERVAL '7 days'", nativeQuery = true)
    int deleteOldEvents();
}
