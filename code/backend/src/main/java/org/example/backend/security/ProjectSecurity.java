package org.example.backend.security;

import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("projectSecurity")
public class ProjectSecurity {

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private TaskRepository taskRepository;

    public boolean isLeaderOrMentor(Long projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        Optional<UserAccount> userOpt = userAccountRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }
        UserAccount user = userOpt.get();

        Optional<ProjectMember> memberOpt = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId());
        if (memberOpt.isEmpty()) {
            return false;
        }

        ProjectMember member = memberOpt.get();
        String roleName = member.getRole() != null ? member.getRole().getName().toUpperCase().replace(" ", "_") : "";

        return "PROJECT_LEADER".equals(roleName) || "LEADER".equals(roleName) || "MENTOR".equals(roleName);
    }
    
    public boolean isProjectMember(Long projectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        Optional<UserAccount> userOpt = userAccountRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }
        UserAccount user = userOpt.get();

        return projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId()).isPresent();
    }
    
    public boolean isLeaderOrMentorByTaskId(Long taskId) {
        return taskRepository.findById(taskId).map(task -> isLeaderOrMentor(task.getProject().getId())).orElse(false);
    }
}
