package org.example.backend.repository;

import org.example.backend.entity.TaskChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskChecklistRepository extends JpaRepository<TaskChecklist, Long> {
}
