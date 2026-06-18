package org.example.backend.repository;

import org.example.backend.entity.AgentTask;
import org.example.backend.entity.enums.AgentTaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AgentTaskRepository extends JpaRepository<AgentTask, UUID> {
    Optional<AgentTask> findFirstByProjectIdAndStatusOrderByCreatedAtAsc(Long projectId, AgentTaskStatus status);

    List<AgentTask> findByStatusAndClaimedAtBefore(AgentTaskStatus status, LocalDateTime before);

    List<AgentTask> findByStatusAndCreatedAtBefore(AgentTaskStatus status, LocalDateTime before);
}
