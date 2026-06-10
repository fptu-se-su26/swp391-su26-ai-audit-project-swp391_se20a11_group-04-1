package org.example.backend.repository;

import org.example.backend.entity.TaskVote;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskVoteRepository extends MongoRepository<TaskVote, String> {
    List<TaskVote> findByTaskId(Long taskId);
    List<TaskVote> findByTaskIdAndUserId(Long taskId, Long userId);
    long countByTaskIdAndIsUpvote(Long taskId, boolean isUpvote);
}
