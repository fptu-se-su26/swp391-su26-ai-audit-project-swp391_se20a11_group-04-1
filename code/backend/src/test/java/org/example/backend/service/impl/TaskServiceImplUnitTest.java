package org.example.backend.service.impl;

import org.example.backend.dto.TaskStatusUpdateRequest;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.ProjectStatus;
import org.example.backend.entity.Task;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.TaskStatus;
import org.example.backend.exception.BadRequestException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplUnitTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @InjectMocks
    @Spy
    private TaskServiceImpl taskService;

    private Task mockTask;
    private Project mockProject;
    private UserAccount mockAssignee;

    @BeforeEach
    void setUp() {
        mockProject = new Project();
        mockProject.setId(10L);
        mockProject.setStatus(ProjectStatus.ACTIVE);

        mockAssignee = new UserAccount();
        mockAssignee.setId(1L);

        mockTask = new Task();
        mockTask.setId(100L);
        mockTask.setProject(mockProject);
        mockTask.setPrimaryAssignee(mockAssignee);
        mockTask.setStatus(TaskStatus.TODO);
    }

    // Nhánh 1: Project bị đóng (Archived)
    @Test
    void testUpdateTaskStatus_ProjectArchived_ThrowsException() {
        mockProject.setStatus(ProjectStatus.ARCHIVED); // Project bị đóng
        when(taskRepository.findWithDetailsById(100L)).thenReturn(Optional.of(mockTask));
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 1L))
            .thenReturn(Optional.of(new ProjectMember()));

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus("IN_PROGRESS");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            taskService.updateTaskStatus(100L, request, 1L)
        );
        assertTrue(ex.getMessage().contains("Project is closed"));
    }

    // Nhánh 2: Đổi trạng thái task của người khác khi không phải là Leader
    @Test
    void testUpdateTaskStatus_NotLeaderAndNotAssignee_ThrowsException() {
        // Project đang Active
        when(taskRepository.findWithDetailsById(100L)).thenReturn(Optional.of(mockTask));
        
        // Người thực hiện hành động là user 2L (không phải assignee là 1L)
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 2L))
            .thenReturn(Optional.of(new ProjectMember())); // Người này là member bình thường (ko role)

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus("IN_PROGRESS");

        BadRequestException ex = assertThrows(BadRequestException.class, () -> 
            taskService.updateTaskStatus(100L, request, 2L)
        );
        assertTrue(ex.getMessage().contains("You do not have permission"));
    }
}
