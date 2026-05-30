package org.example.backend.service;

import org.example.backend.dto.KanbanColumnRequest;
import org.example.backend.dto.KanbanColumnResponse;

import java.util.List;

public interface KanbanColumnService {
    List<KanbanColumnResponse> getProjectColumns(Long projectId, Long userId);
    KanbanColumnResponse createColumn(Long projectId, KanbanColumnRequest request, Long userId);
    KanbanColumnResponse updateColumn(Long projectId, Long columnId, KanbanColumnRequest request, Long userId);
    void archiveColumn(Long projectId, Long columnId, Long userId);
}
