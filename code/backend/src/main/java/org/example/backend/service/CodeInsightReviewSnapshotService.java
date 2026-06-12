package org.example.backend.service;

import org.example.backend.entity.Task;

public interface CodeInsightReviewSnapshotService {
    Long createSnapshot(Task task, Long reviewerId);
}
