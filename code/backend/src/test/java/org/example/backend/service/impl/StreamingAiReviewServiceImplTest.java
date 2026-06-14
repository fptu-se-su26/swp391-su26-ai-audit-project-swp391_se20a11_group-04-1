package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.*;
import org.example.backend.entity.ProjectCodeInsightSettings;
import org.example.backend.entity.Task;
import org.example.backend.repository.*;
import org.example.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StreamingAiReviewServiceImpl")
class StreamingAiReviewServiceImplTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectCodeInsightSettingsRepository settingsRepository;
    @Mock
    private CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    @Mock
    private GitHubPullRequestFileRepository pullRequestFileRepository;
    @Mock
    private CodeInsightPatchService patchService;
    @Mock
    private CodeInsightScoringService scoringService;
    @Mock
    private CodeInsightAiReviewInputBuilder inputBuilder;
    @Mock
    private CodeInsightAiReviewRepository aiReviewRepository;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private RequirementRepository requirementRepository;
    @Mock
    private CodePatchAnalyzerService patchAnalyzerService;
    @Mock
    private ReqDiffAlignmentService alignmentService;
    @Mock
    private WebSocketBroadcastService webSocketBroadcastService;
    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private StreamingAiReviewServiceImpl streamingService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(streamingService, "apiKey", "mock-key");
        ReflectionTestUtils.setField(streamingService, "model", "gemini-2.5-flash");
    }

    @Test
    void testExecuteStreamingReview_NoSettings() {
        Task task = new Task();
        task.setId(1L);
        org.example.backend.entity.Project project = new org.example.backend.entity.Project();
        project.setId(2L);
        task.setProject(project);

        when(taskRepository.findWithDetailsById(1L)).thenReturn(Optional.of(task));
        when(settingsRepository.findByProjectId(2L)).thenReturn(Optional.empty());

        SseEmitter emitter = new SseEmitter();
        try {
            streamingService.executeStreamingReview(2L, 1L, 3L, emitter);
        } catch (Exception ex) {
            assertThat(ex.getMessage()).contains("AI Review is disabled");
        }
    }
}
