package org.example.backend.service.impl;

import org.example.backend.dto.UseCaseRequest;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UseCaseRepository;
import org.example.backend.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UseCaseServiceImplTest {

    @Mock
    private UseCaseRepository useCaseRepository;

    @Mock
    private org.example.backend.repository.RequirementRepository requirementRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private UseCaseServiceImpl useCaseService;

    @Test
    void testCreateUseCase_UserNotFound_ThrowsException() {
        UseCaseRequest request = new UseCaseRequest();
        when(userAccountRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            useCaseService.createUseCase(request, 1L)
        );
    }

    @Test
    void testCreateUseCase_ProjectNotFound_ThrowsException() {
        UseCaseRequest request = new UseCaseRequest();
        request.setRequirementId(10L);
        
        org.example.backend.entity.UserAccount mockUser = new org.example.backend.entity.UserAccount();
        mockUser.setId(1L);

        org.example.backend.entity.Requirement mockReq = new org.example.backend.entity.Requirement();
        org.example.backend.entity.Project mockProject = new org.example.backend.entity.Project();
        mockProject.setId(10L);
        mockReq.setProject(mockProject);
        
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(requirementRepository.findById(10L)).thenReturn(Optional.of(mockReq));
        when(projectRepository.findByIdWithPessimisticWrite(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            useCaseService.createUseCase(request, 1L)
        );
    }
}
