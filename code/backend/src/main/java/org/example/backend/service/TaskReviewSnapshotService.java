package org.example.backend.service;

import org.example.backend.entity.Task;

public interface TaskReviewSnapshotService {
    Long createSnapshot(Task task, Long reviewerId);
}
