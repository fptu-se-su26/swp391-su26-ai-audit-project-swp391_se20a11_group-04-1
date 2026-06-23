package org.example.backend.repository.mongo;

import org.example.backend.entity.mongo.ManualArchitectureOverride;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ManualArchitectureOverrideRepository extends MongoRepository<ManualArchitectureOverride, String> {
    Optional<ManualArchitectureOverride> findByProjectId(Long projectId);
    void deleteByProjectId(Long projectId);
}
