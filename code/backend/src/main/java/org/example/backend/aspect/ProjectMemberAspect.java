package org.example.backend.aspect;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.BusinessException;
import org.example.backend.exception.ForbiddenException;
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

    @Before("@annotation(org.example.backend.annotation.PreAuthorizeProjectMember)")
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

    private Long extractProjectId(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] parameterNames = signature.getParameterNames();

        for (int i = 0; i < parameterNames.length; i++) {
            if ("projectId".equals(parameterNames[i]) && args[i] instanceof Long) {
                return (Long) args[i];
            }
        }
        return null;
    }
}
