// touched
package org.example.backend.repository.mongo;

import org.example.backend.entity.TaskComment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TaskCommentRepository extends MongoRepository<TaskComment, String> {

    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
    List<TaskComment> findByTaskIdIn(List<Long> taskIds);
}
