package org.example.backend.config;

import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@Slf4j
public class SessionRegistryListener implements HttpSessionListener {

    private static final Map<Long, List<HttpSession>> userSessions = new ConcurrentHashMap<>();

    public static void register(Long userId, HttpSession session) {
        if (userId == null || session == null) return;
        List<HttpSession> sessions = userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>());
        if (!sessions.contains(session)) {
            sessions.add(session);
            log.info("Registered HttpSession for User ID {}. Total sessions: {}", userId, sessions.size());
        }
    }

    public static boolean isUserOnline(Long userId) {
        if (userId == null) return false;
        List<HttpSession> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    public static void invalidateSessionsForUser(Long userId) {
        List<HttpSession> sessions = userSessions.remove(userId);
        if (sessions != null) {
            log.info("Invalidating {} HttpSessions for locked User ID {}", sessions.size(), userId);
            for (HttpSession session : sessions) {
                try {
                    session.invalidate();
                } catch (IllegalStateException e) {
                    // Session already invalidated
                }
            }
        }
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        HttpSession session = se.getSession();
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId != null) {
                List<HttpSession> sessions = userSessions.get(userId);
                if (sessions != null) {
                    sessions.remove(session);
                    log.info("Removed HttpSession for User ID {}. Remaining sessions: {}", userId, sessions.size());
                    if (sessions.isEmpty()) {
                        userSessions.remove(userId);
                    }
                }
            }
        } catch (IllegalStateException e) {
            // Session already invalidated or attributes cannot be read, prune map
            pruneStaleSessions();
        }
    }

    private void pruneStaleSessions() {
        userSessions.forEach((userId, sessions) -> {
            sessions.removeIf(session -> {
                try {
                    session.getLastAccessedTime();
                    return false;
                } catch (IllegalStateException e) {
                    return true;
                }
            });
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        });
    }
}
