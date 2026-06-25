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
        } catch (Exception ignored) {}

        Object[] argsSnapshot = joinPoint.getArgs();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            Long entityId = extractEntityId(auditable, argsSnapshot, result);
            auditService.publishSuccess(userId, username,
                    auditable.action(), auditable.entityType(), entityId,
                    argsSnapshot,
                    ip,
                    request != null ? request.getMethod() : "INTERNAL",
                    request != null ? request.getRequestURI() : auditable.action(),
                    duration);
            return result;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - start;
            Long entityId = extractEntityId(auditable, argsSnapshot, null);
            auditService.publishFailure(userId, username,
                    auditable.action(), auditable.entityType(), entityId,
                    ip,
                    request != null ? request.getMethod() : "INTERNAL",
                    request != null ? request.getRequestURI() : auditable.action(),
                    ex.getMessage(), duration);
            throw ex;
        }
    }

    /**
     * Extracts entityId from method args (by index) or from the return value (via getId() reflection).
     * entityIdArgIndex >= 0 → use args[index]; -1 → try result.getId().
     */
    private Long extractEntityId(Auditable auditable, Object[] args, Object result) {
        int idx = auditable.entityIdArgIndex();
        if (idx >= 0) {
            if (args != null && idx < args.length && args[idx] instanceof Number n) {
                return n.longValue();
            }
            return null;
        }
        if (result != null) {
            try {
                Object id = result.getClass().getMethod("getId").invoke(result);
                if (id instanceof Number n) return n.longValue();
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
