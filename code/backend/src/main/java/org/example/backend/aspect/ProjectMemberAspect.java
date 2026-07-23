package org.example.backend.aspect;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.BusinessException;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.entity.ProjectMember;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ProjectMemberAspect {

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Before("@annotation(org.example.backend.annotation.PreAuthorizeProjectMember) || @within(org.example.backend.annotation.PreAuthorizeProjectMember)")
    public void checkProjectMembership(JoinPoint joinPoint) {
        Long projectId = extractProjectId(joinPoint);

        if (projectId == null) {
            throw new BusinessException("Project ID is missing in the method parameters. Cannot verify membership.", "PROJECT_ID_MISSING");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ForbiddenException("Authentication is required");
        }

        String username = authentication.getName();
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ForbiddenException("Authenticated user not found"));

        projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ForbiddenException("Access Denied: You are not an active member of this project"));
    }

    @Before("@annotation(org.example.backend.annotation.PreAuthorizeProjectLeader) || @within(org.example.backend.annotation.PreAuthorizeProjectLeader)")
    public void checkProjectLeader(JoinPoint joinPoint) {
        Long projectId = extractProjectId(joinPoint);

        if (projectId == null) {
            throw new BusinessException("Project ID is missing in the method parameters. Cannot verify leadership.", "PROJECT_ID_MISSING");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ForbiddenException("Authentication is required");
        }

        String username = authentication.getName();
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ForbiddenException("Authenticated user not found"));

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ForbiddenException("Access Denied: You are not an active member of this project"));

        if (member.getRole() == null || !member.getRole().getName().toUpperCase().contains("LEADER")) {
            throw new ForbiddenException("Access Denied: You must be a LEADER of this project to perform this action");
        }
    }

    private Long extractProjectId(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();

        for (int i = 0; i < parameterNames.length; i++) {
            if ("projectId".equals(parameterNames[i]) && args[i] instanceof Long) {
                return (Long) args[i];
            }
        }
        
        // Fallback: look for an argument that has a getProjectId() method
        for (Object arg : args) {
            if (arg != null) {
                try {
                    java.lang.reflect.Method getProjectIdMethod = arg.getClass().getMethod("getProjectId");
                    Object value = getProjectIdMethod.invoke(arg);
                    if (value instanceof Long) {
                        return (Long) value;
                    }
                } catch (Exception e) {
                    // Ignore if method doesn't exist
                }
            }
        }
        
        return null;
    }
}
