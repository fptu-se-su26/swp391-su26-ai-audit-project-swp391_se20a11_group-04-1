package org.example.backend.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.service.AuditService;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 1)
@RequiredArgsConstructor
@Slf4j
public class AuditFilter extends OncePerRequestFilter {

    private final AuditService auditService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        return uri.startsWith("/ws/") ||
               uri.startsWith("/actuator/") ||
               uri.contains("/favicon") ||
               "OPTIONS".equalsIgnoreCase(method);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();
        Long userId = null;
        String username = null;
        
        HttpSession session = request.getSession(false);
        if (session != null) {
            userId = (Long) session.getAttribute("userId");
            username = (String) session.getAttribute("username");
        }
        
        String ipAddress = getClientIp(request);
        String action = request.getMethod() + " " + request.getRequestURI();

        boolean alreadyLogged = false;
        try {
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            alreadyLogged = true;
            long durationMs = System.currentTimeMillis() - startTime;
            auditService.publishFailure(userId, username, action, null, null, null, ipAddress,
                    request.getMethod(), request.getRequestURI(), ex.getMessage(), durationMs);
            throw ex;
        } finally {
            if (!alreadyLogged) {
                long durationMs = System.currentTimeMillis() - startTime;
                if (response.getStatus() >= 400) {
                    auditService.publishFailure(userId, username, action, null, null, null, ipAddress,
                            request.getMethod(), request.getRequestURI(),
                            "HTTP " + response.getStatus(), durationMs);
                } else {
                    auditService.publishSuccess(userId, username, action, null, null, null, null,
                            ipAddress, request.getMethod(), request.getRequestURI(), durationMs);
                }
            }
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
