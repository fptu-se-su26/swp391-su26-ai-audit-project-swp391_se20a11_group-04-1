package org.example.backend.repository.mongo;

import org.example.backend.entity.mongo.ArchitectureGraph;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArchitectureGraphRepository extends MongoRepository<ArchitectureGraph, String> {
    Optional<ArchitectureGraph> findByProjectId(Long projectId);
    void deleteByProjectId(Long projectId);
}
