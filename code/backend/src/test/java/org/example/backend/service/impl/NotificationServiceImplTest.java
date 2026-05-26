package org.example.backend.service.impl;

import org.example.backend.dto.NotificationResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.NotificationRepository;
import org.example.backend.repository.ProjectInvitationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationServiceImpl — Unit Tests")
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ProjectInvitationRepository projectInvitationRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private UserAccount mockUser;
    private Project mockProject;
    private Notification mockNotification;
    private ProjectInvitation mockInvitation;

    @BeforeEach
    void setUp() {
        mockUser = new UserAccount();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");

        mockProject = new Project();
        mockProject.setId(4L);
        mockProject.setName("DevTrack AI");

        mockInvitation = new ProjectInvitation();
        mockInvitation.setId(3L);
        mockInvitation.setStatus(ProjectInvitationStatus.PENDING);

        mockNotification = Notification.builder()
                .id(10L)
                .recipient(mockUser)
                .project(mockProject)
                .entityType(NotificationEntityType.PROJECT_INVITATION)
                .title("Lời mời tham gia dự án")
                .message("Đạt Nguyễn Thành đã mời bạn...")
                .type(NotificationType.INVITATION)
                .relatedId(mockInvitation.getId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("getMyNotifications — Should map projectId and entityType correctly from entity to DTO")
    void getMyNotifications_Success() {
        // GIVEN
        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(mockNotification));
        when(projectInvitationRepository.findById(mockInvitation.getId()))
                .thenReturn(Optional.of(mockInvitation));

        // WHEN
        List<NotificationResponse> result = notificationService.getMyNotifications(1L);

        // THEN
        assertThat(result).hasSize(1);
        NotificationResponse response = result.get(0);
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getTitle()).isEqualTo("Lời mời tham gia dự án");
        assertThat(response.getProjectId()).isEqualTo(4L); // Verify project_id mapped correctly
        assertThat(response.getEntityType()).isEqualTo("PROJECT_INVITATION"); // Verify entity_type mapped correctly
        assertThat(response.getInvitationStatus()).isEqualTo("PENDING");

        verify(notificationRepository).findByRecipientIdOrderByCreatedAtDesc(1L);
        verify(projectInvitationRepository).findById(mockInvitation.getId());
    }
}
