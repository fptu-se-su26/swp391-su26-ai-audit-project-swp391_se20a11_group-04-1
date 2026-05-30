package org.example.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@Slf4j
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    // Lưu các WebSocket session theo userId. Một user có thể mở nhiều tab (nhiều session).
    private static final Map<Long, List<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = getUserId(session);
        if (userId == null) {
            log.warn("❌ Rejected WebSocket connection from IP {} - Missing userId parameter.", session.getRemoteAddress());
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(session);
        log.info("🔌 WebSocket connected: User ID {} successfully connected. Active sessions: {}", userId, userSessions.get(userId).size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = getUserId(session);
        if (userId != null && userSessions.containsKey(userId)) {
            List<WebSocketSession> sessions = userSessions.get(userId);
            sessions.remove(session);
            log.info("🔌 WebSocket disconnected: User ID {} closed a session. Remaining sessions: {}", userId, sessions.size());
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        Long userId = getUserId(session);
        log.error("❌ WebSocket transport error for User ID {}: {}", userId, exception.getMessage());
    }

    /**
     * Gửi tin nhắn real-time tới một user cụ thể
     */
    public static void sendToUser(Long userId, String jsonPayload) {
        List<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        log.info("🚀 Sending WebSocket message to User ID {}: {}", userId, jsonPayload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(jsonPayload));
                } catch (IOException e) {
                    log.error("❌ Failed to send WebSocket message to User ID {}", userId, e);
                }
            }
        }
    }

    private Long getUserId(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri == null) return null;
            String query = uri.getQuery();
            if (query == null) return null;

            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length > 1 && "userId".equalsIgnoreCase(pair[0])) {
                    return Long.parseLong(pair[1]);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse userId from URI: {}", session.getUri(), e);
        }
        return null;
    }
}
