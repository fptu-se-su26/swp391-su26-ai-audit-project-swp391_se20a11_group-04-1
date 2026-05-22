package org.example.backend.service;

import org.example.backend.dto.RtmMatrixResponse;
import org.example.backend.dto.RtmSnapshotResponse;
import org.example.backend.dto.RtmSummaryResponse;

import java.util.List;

public interface RtmService {
    RtmMatrixResponse getMatrix(Long projectId, Long userId);

    RtmSummaryResponse getSummary(Long projectId, Long userId);

    RtmSnapshotResponse saveSnapshot(Long projectId, Long sprintId, Long userId);

    List<RtmSnapshotResponse> getSnapshots(Long projectId, Long userId);

    void migrateSnapshotsToProjectScopedCode();
}
