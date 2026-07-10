// touched
package org.example.backend.repository.mongo;

import org.example.backend.entity.TaskProposal;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TaskProposalRepository extends MongoRepository<TaskProposal, String> {

    List<TaskProposal> findByTaskIdOrderByCreatedAtAsc(Long taskId);
    List<TaskProposal> findByTaskIdIn(List<Long> taskIds);
}
