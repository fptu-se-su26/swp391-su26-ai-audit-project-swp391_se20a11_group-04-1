package org.example.backend.service.sla;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.SlaDecisionPackResponse;
import org.example.backend.entity.Project;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskSlaState;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.SlaActionLogRepository;
import org.example.backend.repository.SlaDecisionLogRepository;
import org.example.backend.repository.RecoveryPlanRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SlaDecisionPackService — Unit Tests")
class SlaDecisionPackServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskSlaStateRepository taskSlaStateRepository;

    @Mock
    private SlaDecisionLogRepository slaDecisionLogRepository;

    @Mock
    private SlaActionLogRepository slaActionLogRepository;

    @Mock
    private RecoveryPlanRepository recoveryPlanRepository;

    @Mock
    private SlaStateService slaStateService;

    private ObjectMapper objectMapper;
    private SlaDecisionPackService slaDecisionPackService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        slaDecisionPackService = new SlaDecisionPackService(
                taskRepository,
                taskSlaStateRepository,
                slaDecisionLogRepository,
                slaActionLogRepository,
                recoveryPlanRepository,
                slaStateService,
                objectMapper
        );
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException if task does not exist")
    void testGetTaskDecisionPackNotFound() {
        when(taskRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> slaDecisionPackService.getTaskDecisionPack(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Task not found");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException if task belongs to a different project")
    void testGetTaskDecisionPackWrongProject() {
        Project project = Project.builder().id(2L).build();
        Task task = Task.builder().id(100L).project(project).build();

        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> slaDecisionPackService.getTaskDecisionPack(1L, 100L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("does not belong to Project ID");
    }

    @Test
    @DisplayName("Should evaluate and persist state if missing initially")
    void testGetTaskDecisionPackTriggersEvaluationIfStateMissing() {
        Project project = Project.builder().id(1L).build();
        Task task = Task.builder().id(100L).project(project).build();
        TaskSlaState state = TaskSlaState.builder()
                .taskId(100L)
                .projectId(1L)
                .currentScore(85)
                .currentRiskLevel("LOW")
                .categoriesJson("[\"DUE_IN_3_DAYS\"]")
                .reasonsJson("[\"Task deadline is in 3 days.\"]")
                .recommendedAction("Plan remaining work before the deadline.")
                .build();

        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        // First find returns empty, second returns the newly evaluated state
        when(taskSlaStateRepository.findByTaskIdAndProjectId(100L, 1L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(state));
        when(recoveryPlanRepository.findTopByProjectIdAndTaskIdOrderByCreatedAtDesc(1L, 100L))
                .thenReturn(Optional.empty());

        SlaDecisionPackResponse response = slaDecisionPackService.getTaskDecisionPack(1L, 100L);

        verify(slaStateService, times(1)).evaluateAndPersist(100L, "API_TRIGGER");
        assertThat(response.getCurrentScore()).isEqualTo(85);
        assertThat(response.getCurrentRiskLevel()).isEqualTo("LOW");
        assertThat(response.getSlaCategories()).contains("DUE_IN_3_DAYS");
    }
}
