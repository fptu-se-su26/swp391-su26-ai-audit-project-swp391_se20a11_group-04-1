package org.example.backend.service.impl;

import org.example.backend.dto.SprintResponse;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.Sprint;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SprintServiceImplTest {

    @Mock
    private SprintRepository sprintRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private SprintServiceImpl sprintService;

    @Test
    void testGetProjectSprints_UserNotMember_ThrowsException() {
        when(projectMemberRepository.findByProjectIdAndUserId(1L, 1L))
                .thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> 
            sprintService.getProjectSprints(1L, 1L)
        );
    }

    @Test
    void testGetProjectSprints_Success() {
        when(projectMemberRepository.findByProjectIdAndUserId(1L, 1L))
                .thenReturn(Optional.of(new ProjectMember()));
        when(taskRepository.findByProjectIdOrderByUpdatedAtDesc(1L))
                .thenReturn(Collections.emptyList());
        when(sprintRepository.findByProjectIdOrderByStartDateAscIdAsc(1L))
                .thenReturn(Collections.emptyList());

        List<SprintResponse> responses = sprintService.getProjectSprints(1L, 1L);
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }
}
