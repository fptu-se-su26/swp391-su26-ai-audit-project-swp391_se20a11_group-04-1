package org.example.backend.repository;

import org.example.backend.entity.DeadLetterEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeadLetterEventRepository extends JpaRepository<DeadLetterEvent, Long> {
    Optional<DeadLetterEvent> findByOriginalEventId(Long originalEventId);
}
