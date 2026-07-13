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
        removeSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        Long userId = getUserId(session);
        if (exception instanceof java.nio.channels.ClosedChannelException) {
            log.debug("WebSocket transport error for User ID {} (Channel closed)", userId);
        } else {
            log.error("❌ WebSocket transport error for User ID {}: {}", userId, exception.getMessage());
        }
        // BUG FIX #7: xóa session khỏi map khi transport error để tránh zombie session
        removeSession(session);
        // Đóng session nếu vẫn còn mở
        try {
            if (session.isOpen()) session.close(CloseStatus.SERVER_ERROR);
        } catch (Exception ignored) {}
    }

    /**
     * BUG FIX #7: Helper dùng chung để xóa session — gọi từ cả close và transport error.
     */
    private void removeSession(WebSocketSession session) {
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

    /**
     * Kiểm tra có session nào đang kết nối không — dùng để tránh I/O thừa khi không ai online.
     */
    public static boolean hasActiveSessions() {
        return !userSessions.isEmpty();
    }

    /**
     * Gửi tin nhắn real-time tới tất cả các session đang kết nối.
     * BUG FIX #8: Tách ra từng session riêng lẻ, bỏ qua session chậm/lỗi thay vì block toàn bộ.
     */
    public static void broadcast(String jsonPayload) {
        if (userSessions.isEmpty()) return; // short-circuit khi không ai kết nối

        log.debug("🚀 Broadcasting WebSocket message to {} user(s)", userSessions.size());
        userSessions.forEach((userId, sessions) -> {
            for (WebSocketSession session : sessions) {
                if (!session.isOpen()) continue;
                try {
                    synchronized (session) {
                        session.sendMessage(new TextMessage(jsonPayload));
                    }
                } catch (IOException e) {
                    if (e instanceof java.nio.channels.ClosedChannelException || (e.getCause() != null && e.getCause() instanceof java.nio.channels.ClosedChannelException)) {
                        log.debug("Skipping WebSocket broadcast to User ID {} (Channel closed)", userId);
                    } else {
                        log.error("❌ Failed to broadcast WebSocket message to User ID {}", userId, e);
                    }
                }
            }
        });
    }

    /**
     * Gửi tin nhắn real-time tới một user cụ thể
     */
    public static void sendToUser(Long userId, String jsonPayload) {
        List<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        log.debug("🚀 Sending WebSocket message to User ID {}", userId);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    synchronized (session) {
                        session.sendMessage(new TextMessage(jsonPayload));
                    }
                } catch (IOException e) {
                    if (e instanceof java.nio.channels.ClosedChannelException || (e.getCause() != null && e.getCause() instanceof java.nio.channels.ClosedChannelException)) {
                        log.debug("Skipping WebSocket send to User ID {} (Channel closed)", userId);
                    } else {
                        log.error("❌ Failed to send WebSocket message to User ID {}", userId, e);
                    }
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
