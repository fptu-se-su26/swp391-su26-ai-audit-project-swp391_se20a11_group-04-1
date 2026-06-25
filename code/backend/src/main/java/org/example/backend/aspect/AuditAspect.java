package org.example.backend.aspect;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.example.backend.annotation.Auditable;
import org.example.backend.service.AuditService;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditService auditService;

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        long start = System.currentTimeMillis();

        HttpServletRequest request = null;
        Long userId = null;
        String username = null;
        String ip = "INTERNAL";

        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                request = attrs.getRequest();
                HttpSession session = request.getSession(false);
                if (session != null) {
                    userId = (Long) session.getAttribute("userId");
                    username = (String) session.getAttribute("username");
                }
                ip = getClientIp(request);
            }
        } catch (Exception ignored) {
            // Context might not be available, fallback to defaults
        }

        Object[] argsSnapshot = joinPoint.getArgs();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            auditService.publishSuccess(userId, username,
                    auditable.action(), auditable.entityType(), null,
                    argsSnapshot,
                    ip,
                    request != null ? request.getMethod() : "INTERNAL",
                    request != null ? request.getRequestURI() : auditable.action(),
                    duration);
            return result;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - start;
            auditService.publishFailure(userId, username,
                    auditable.action(), ip,
                    request != null ? request.getMethod() : "INTERNAL",
                    request != null ? request.getRequestURI() : auditable.action(),
                    ex.getMessage(), duration);
            throw ex;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
