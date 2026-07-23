package org.example.backend.service.impl;

import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.entity.ProjectMember;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RequirementServiceImplTest {

    @Mock
    private RequirementRepository requirementRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private RequirementServiceImpl requirementService;

    @Test
    void testCreateRequirement_UserNotAuthenticated_ThrowsException() {
        SecurityContextHolder.clearContext();
        org.example.backend.dto.RequirementRequestDTO request = new org.example.backend.dto.RequirementRequestDTO();
        request.setProjectId(1L);

        assertThrows(ForbiddenException.class, () -> 
            requirementService.createRequirement(request, null)
        );
    }

    @Test
    void testCreateRequirement_UserNotMember_ThrowsException() {
        Authentication auth = mock(Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getName()).thenReturn("testuser");
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        org.example.backend.entity.UserAccount mockUser = new org.example.backend.entity.UserAccount();
        mockUser.setId(1L);

        when(userAccountRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(projectMemberRepository.findByProjectIdAndUserId(1L, 1L)).thenReturn(Optional.empty());

        org.example.backend.dto.RequirementRequestDTO request = new org.example.backend.dto.RequirementRequestDTO();
        request.setProjectId(1L);

        assertThrows(ForbiddenException.class, () -> 
            requirementService.createRequirement(request, null)
        );
    }
}
