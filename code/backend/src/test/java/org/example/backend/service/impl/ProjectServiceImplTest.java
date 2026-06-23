package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
import org.example.backend.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.http.HttpStatus;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.exception.CustomException;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectServiceImpl — Unit Tests")
class ProjectServiceImplTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ProjectRoleRepository projectRoleRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private ProjectInvitationRepository projectInvitationRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private TransactionTemplate transactionTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private org.example.backend.service.github.GitHubApiService gitHubApiService;

    @InjectMocks
    private ProjectServiceImpl projectService;

    private UserAccount mockInviter;
    private UserAccount mockInvitee;
    private Project mockProject;

    @BeforeEach
    void setUp() {
        mockInviter = new UserAccount();
        mockInviter.setId(1L);
        mockInviter.setEmail("leader@fpt.edu.vn");
        UserProfile inviterProfile = new UserProfile();
        inviterProfile.setFullName("Nguyen Thanh Dat");
        mockInviter.setProfile(inviterProfile);

        mockInvitee = new UserAccount();
        mockInvitee.setId(2L);
        mockInvitee.setEmail("facker3004@gmail.com");
        UserProfile inviteeProfile = new UserProfile();
        inviteeProfile.setFullName("Facker User");
        mockInvitee.setProfile(inviteeProfile);

        mockProject = new Project();
        mockProject.setId(100L);
        mockProject.setName("DevTrack AI");
        mockProject.setDeadline(LocalDate.now().plusMonths(3));
    }

    @Test
    @DisplayName("inviteMember — Should save ProjectInvitation and a Notification with correct project and entityType")
    void inviteMember_Success() {
        // GIVEN
        when(projectRepository.findById(100L)).thenReturn(Optional.of(mockProject));
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(mockInviter));
        when(userAccountRepository.findByEmail("facker3004@gmail.com")).thenReturn(Optional.of(mockInvitee));

        when(projectMemberRepository.findByProjectIdAndUserId(100L, 2L)).thenReturn(Optional.empty());
        when(projectInvitationRepository.findByProjectIdAndInviteeIdAndStatus(100L, 2L, ProjectInvitationStatus.PENDING))
                .thenReturn(Optional.empty());

        // Mock save calls to return simulated database-persisted entities with generated IDs
        when(projectInvitationRepository.save(any(ProjectInvitation.class))).thenAnswer(invocation -> {
            ProjectInvitation invitation = invocation.getArgument(0);
            invitation.setId(300L);
            return invitation;
        });

        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification notification = invocation.getArgument(0);
            notification.setId(400L);
            return notification;
        });

        // WHEN
        projectService.inviteMember(100L, "facker3004@gmail.com", 1L);

        // THEN
        // 1. Verify invitation was saved and all mandatory fields are fully populated
        ArgumentCaptor<ProjectInvitation> invitationCaptor = ArgumentCaptor.forClass(ProjectInvitation.class);
        verify(projectInvitationRepository, times(1)).save(invitationCaptor.capture());

        ProjectInvitation capturedInvitation = invitationCaptor.getValue();
        assertThat(capturedInvitation.getProject()).isNotNull();
        assertThat(capturedInvitation.getProject().getId()).isEqualTo(100L);
        assertThat(capturedInvitation.getInviter()).isNotNull();
        assertThat(capturedInvitation.getInviter().getId()).isEqualTo(1L);
        assertThat(capturedInvitation.getInvitee()).isNotNull();
        assertThat(capturedInvitation.getInvitee().getId()).isEqualTo(2L);
        assertThat(capturedInvitation.getToken()).isNotBlank();
        assertThat(capturedInvitation.getStatus()).isEqualTo(ProjectInvitationStatus.PENDING);
        assertThat(capturedInvitation.getExpiresAt()).isNotNull();

        // 2. Capture and verify the Notification was created with the correct properties
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(notificationCaptor.capture());

        Notification capturedNotification = notificationCaptor.getValue();
        assertThat(capturedNotification.getRecipient()).isNotNull();
        assertThat(capturedNotification.getRecipient().getId()).isEqualTo(2L);
        assertThat(capturedNotification.getProject()).isNotNull();
        assertThat(capturedNotification.getProject().getId()).isEqualTo(100L); // Verify project_id is populated!
        assertThat(capturedNotification.getEntityType()).isEqualTo(NotificationEntityType.PROJECT_INVITATION); // Verify entityType enum value is set!
        assertThat(capturedNotification.getType()).isEqualTo(NotificationType.INVITATION);
        assertThat(capturedNotification.getRelatedId()).isEqualTo(300L); // Verify invitation ID link is set!
        
        // Assert all other mandatory fields for Notifications are fully populated
        assertThat(capturedNotification.getTitle()).isNotBlank();
        assertThat(capturedNotification.getMessage()).isNotBlank();
        assertThat(capturedNotification.isRead()).isFalse();
        assertThat(capturedNotification.getCreatedAt()).isNotNull();

        // 3. Verify Email is sent
        verify(emailService, times(1)).sendEmail(
                eq("facker3004@gmail.com"),
                eq("DevTrack - Lời mời tham gia dự án"),
                anyString()
        );
    }

    @Test
    @DisplayName("acceptInvitation — Nên đồng ý lời mời, lưu thành viên mới và kích hoạt gửi WebSocket")
    void acceptInvitation_Success() {
        // GIVEN
        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setId(300L);
        invitation.setProject(mockProject);
        invitation.setInviter(mockInviter);
        invitation.setInvitee(mockInvitee);
        invitation.setStatus(ProjectInvitationStatus.PENDING);
        invitation.setExpiresAt(java.time.LocalDateTime.now().plusDays(2));
        invitation.setToken("valid-token");

        when(projectInvitationRepository.findById(300L)).thenReturn(Optional.of(invitation));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 2L)).thenReturn(Optional.empty());
        
        ProjectRole mockMemberRole = new ProjectRole();
        mockMemberRole.setName("MEMBER");
        when(projectRoleRepository.findByName("MEMBER")).thenReturn(Optional.of(mockMemberRole));

        ProjectMember existingMember = new ProjectMember();
        ProjectRole mockLeaderRole = new ProjectRole();
        mockLeaderRole.setName("LEADER");
        existingMember.setRole(mockLeaderRole);
        existingMember.setUser(mockInviter);
        when(projectMemberRepository.findByProjectId(100L)).thenReturn(java.util.List.of(existingMember));

        when(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(2L)).thenReturn(new java.util.ArrayList<>());

        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification notification = inv.getArgument(0);
            notification.setId(401L);
            return notification;
        });

        // WHEN
        projectService.acceptInvitation(300L, null, 2L);

        // THEN
        assertThat(invitation.getStatus()).isEqualTo(ProjectInvitationStatus.ACCEPTED);
        
        ArgumentCaptor<ProjectMember> memberCaptor = ArgumentCaptor.forClass(ProjectMember.class);
        verify(projectMemberRepository, times(1)).save(memberCaptor.capture());
        ProjectMember capturedMember = memberCaptor.getValue();
        assertThat(capturedMember.getProject().getId()).isEqualTo(100L);
        assertThat(capturedMember.getUser().getId()).isEqualTo(2L);
        assertThat(capturedMember.getRole().getName()).isEqualTo("MEMBER");

        // Verify notification saved for inviter
        ArgumentCaptor<Notification> notificationCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(1)).save(notificationCaptor.capture());
        Notification capturedNotification = notificationCaptor.getValue();
        assertThat(capturedNotification.getRecipient().getId()).isEqualTo(1L); // Inviter ID
        assertThat(capturedNotification.getProject().getId()).isEqualTo(100L);
        assertThat(capturedNotification.getEntityType()).isEqualTo(NotificationEntityType.PROJECT_INVITATION);
        assertThat(capturedNotification.getType()).isEqualTo(NotificationType.SYSTEM);
        assertThat(capturedNotification.getRelatedId()).isEqualTo(300L);
        assertThat(capturedNotification.getMessage()).isEqualTo("Facker User đã chấp nhận lời mời của bạn");
    }

    @Test
    @DisplayName("getProjectById — Should return project details when user is a member")
    void getProjectById_Success_WhenUserIsMember() {
        // GIVEN
        Project project = new Project();
        project.setId(100L);
        project.setName("DevTrack AI");
        project.setType(ProjectType.WEB_APP);
        project.setDeadline(LocalDate.now().plusMonths(3));
        project.setStatus(ProjectStatus.PLANNING);

        ProjectMember member = new ProjectMember();
        member.setUser(mockInvitee); // ID = 2L
        ProjectRole role = new ProjectRole();
        role.setName("MEMBER");
        member.setRole(role);
        project.setMembers(List.of(member));

        when(projectRepository.findById(100L)).thenReturn(Optional.of(project));

        // WHEN
        ProjectResponse response = projectService.getProjectById(100L, 2L);

        // THEN
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("DevTrack AI");
    }

    @Test
    @DisplayName("getProjectById — Should throw FORBIDDEN when user is not member or classroom owner")
    void getProjectById_Forbidden_WhenUserNotAuthorized() {
        // GIVEN
        Project project = new Project();
        project.setId(100L);
        project.setName("DevTrack AI");
        project.setType(ProjectType.WEB_APP);
        project.setDeadline(LocalDate.now().plusMonths(3));
        project.setStatus(ProjectStatus.PLANNING);
        project.setMembers(List.of()); // No members

        AcademicContext ac = new AcademicContext();
        UserAccount classOwner = new UserAccount();
        classOwner.setId(99L);
        ac.setOwner(classOwner);
        project.setAcademicContext(ac);

        when(projectRepository.findById(100L)).thenReturn(Optional.of(project));

        // WHEN / THEN
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> {
            projectService.getProjectById(100L, 2L); // 2L is not member and not classroom owner (99L)
        }).isInstanceOf(CustomException.class)
          .hasMessageContaining("Bạn không có quyền truy cập dự án này.")
          .extracting(e -> ((CustomException) e).getStatus())
          .isEqualTo(HttpStatus.FORBIDDEN);
    }
}
