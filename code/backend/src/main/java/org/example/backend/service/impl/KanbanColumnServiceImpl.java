package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.KanbanColumnRequest;
import org.example.backend.dto.KanbanColumnResponse;
import org.example.backend.entity.KanbanColumn;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectMember;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.KanbanColumnRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.service.KanbanColumnService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class KanbanColumnServiceImpl implements KanbanColumnService {

    private static final List<DefaultColumn> DEFAULT_COLUMNS = List.of(
            new DefaultColumn("Todo", "TODO", "bg-outline", 0),
            new DefaultColumn("In Progress", "IN_PROGRESS", "bg-primary", 1),
            new DefaultColumn("In Review", "IN_REVIEW", "bg-[#a855f7]", 2),
            new DefaultColumn("Done", "DONE", "bg-[#16a34a]", 3),
            new DefaultColumn("Blocked", "BLOCKED", "bg-error", 4)
    );

    private final KanbanColumnRepository kanbanColumnRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Override
    public List<KanbanColumnResponse> getProjectColumns(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);
        ensureDefaultColumns(projectId);
        return kanbanColumnRepository.findByProjectIdAndArchivedFalseOrderByColumnOrderAscIdAsc(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public KanbanColumnResponse createColumn(Long projectId, KanbanColumnRequest request, Long userId) {
        ensureProjectLeader(projectId, userId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
        String name = requiredText(request.getName(), "Column name is required");
        ensureNameAvailable(projectId, name, null);

        int nextOrder = kanbanColumnRepository.findByProjectIdOrderByColumnOrderAscIdAsc(projectId).stream()
                .mapToInt(KanbanColumn::getColumnOrder)
                .max()
                .orElse(-1) + 1;

        KanbanColumn column = KanbanColumn.builder()
                .project(project)
                .name(name)
                .color(cleanColor(request.getColor()))
                .columnOrder(request.getColumnOrder() != null ? request.getColumnOrder() : nextOrder)
                .defaultColumn(false)
                .archived(false)
                .build();

        return toResponse(kanbanColumnRepository.save(column));
    }

    @Override
    public KanbanColumnResponse updateColumn(Long projectId, Long columnId, KanbanColumnRequest request, Long userId) {
        ensureProjectLeader(projectId, userId);
        KanbanColumn column = findProjectColumn(projectId, columnId);

        if (request.getName() != null) {
            String name = requiredText(request.getName(), "Column name is required");
            ensureNameAvailable(projectId, name, columnId);
            column.setName(name);
        }
        if (request.getColor() != null) {
            column.setColor(cleanColor(request.getColor()));
        }
        if (request.getColumnOrder() != null) {
            column.setColumnOrder(request.getColumnOrder());
        }
        if (request.getArchived() != null) {
            column.setArchived(request.getArchived());
        }

        return toResponse(kanbanColumnRepository.save(column));
    }

    @Override
    public void archiveColumn(Long projectId, Long columnId, Long userId) {
        ensureProjectLeader(projectId, userId);
        KanbanColumn column = findProjectColumn(projectId, columnId);
        if (column.isDefaultColumn()) {
            throw new BadRequestException("Default columns cannot be archived");
        }
        column.setArchived(true);
        kanbanColumnRepository.save(column);
    }

    public synchronized List<KanbanColumn> ensureDefaultColumns(Long projectId) {
        List<KanbanColumn> existing = kanbanColumnRepository.findByProjectIdOrderByColumnOrderAscIdAsc(projectId);
        if (!existing.isEmpty()) {
            return existing;
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
        List<KanbanColumn> columns = DEFAULT_COLUMNS.stream()
                .map(defaultColumn -> KanbanColumn.builder()
                        .project(project)
                        .name(defaultColumn.name())
                        .statusKey(defaultColumn.statusKey())
                        .color(defaultColumn.color())
                        .columnOrder(defaultColumn.order())
                        .defaultColumn(true)
                        .archived(false)
                        .build())
                .collect(Collectors.toList());
        return kanbanColumnRepository.saveAll(columns);
    }

    private KanbanColumn findProjectColumn(Long projectId, Long columnId) {
        return kanbanColumnRepository.findById(columnId)
                .filter(column -> column.getProject() != null && projectId.equals(column.getProject().getId()))
                .orElseThrow(() -> new CustomException("Kanban column not found", HttpStatus.NOT_FOUND));
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN);
        }
    }

    private void ensureProjectLeader(Long projectId, Long userId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));
        String roleName = member.getRole() != null ? member.getRole().getName() : "";
        if (!"PROJECT_LEADER".equalsIgnoreCase(roleName) && !"LEADER".equalsIgnoreCase(roleName)) {
            throw new CustomException("Only project leaders can manage board columns", HttpStatus.FORBIDDEN);
        }
    }

    private void ensureNameAvailable(Long projectId, String name, Long currentColumnId) {
        kanbanColumnRepository.findByProjectIdAndNameIgnoreCase(projectId, name)
                .filter(column -> currentColumnId == null || !currentColumnId.equals(column.getId()))
                .ifPresent(column -> {
                    throw new BadRequestException("Column name already exists");
                });
    }

    private String requiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private String cleanColor(String color) {
        if (color == null || color.trim().isEmpty()) {
            return "bg-outline";
        }
        String trimmed = color.trim();
        if (trimmed.length() > 80) {
            throw new BadRequestException("Column color is too long");
        }
        return trimmed.toLowerCase(Locale.ROOT).startsWith("bg-") ? trimmed : "bg-outline";
    }

    private KanbanColumnResponse toResponse(KanbanColumn column) {
        return KanbanColumnResponse.builder()
                .id(column.getId())
                .projectId(column.getProject() != null ? column.getProject().getId() : null)
                .name(column.getName())
                .statusKey(column.getStatusKey())
                .color(column.getColor())
                .columnOrder(column.getColumnOrder())
                .defaultColumn(column.isDefaultColumn())
                .archived(column.isArchived())
                .build();
    }

    private record DefaultColumn(String name, String statusKey, String color, int order) {
    }
}
