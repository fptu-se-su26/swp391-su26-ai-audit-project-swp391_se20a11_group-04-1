package org.example.backend.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationWebSocketHandler — Unit Tests")
class NotificationWebSocketHandlerTest {

    @InjectMocks
    private NotificationWebSocketHandler handler;

    @Mock
    private WebSocketSession mockSession;

    @BeforeEach
    void setUp() throws Exception {
        // Đảm bảo đóng mockSession từ các test case trước (nếu có lưu tĩnh)
        try {
            handler.afterConnectionClosed(mockSession, CloseStatus.NORMAL);
        } catch (Exception e) {
            // bỏ qua
        }
    }

    @Test
    @DisplayName("afterConnectionEstablished — Nên chấp nhận kết nối khi có userId hợp lệ")
    void afterConnectionEstablished_WithValidUserId_ShouldAccept() throws Exception {
        // GIVEN
        URI uri = new URI("ws://localhost:8080/api/ws/notifications?userId=123");
        when(mockSession.getUri()).thenReturn(uri);

        // WHEN
        handler.afterConnectionEstablished(mockSession);

        // THEN: Không bị close
        verify(mockSession, never()).close(any(CloseStatus.class));

        // Test sending message
        when(mockSession.isOpen()).thenReturn(true);
        NotificationWebSocketHandler.sendToUser(123L, "{\"message\":\"Hello\"}");
        verify(mockSession, times(1)).sendMessage(any(TextMessage.class));
    }

    @Test
    @DisplayName("afterConnectionEstablished — Nên từ chối kết nối khi thiếu hoặc sai userId")
    void afterConnectionEstablished_WithInvalidUserId_ShouldReject() throws Exception {
        // GIVEN
        URI uri = new URI("ws://localhost:8080/api/ws/notifications?wrongParam=abc");
        when(mockSession.getUri()).thenReturn(uri);
        when(mockSession.getRemoteAddress()).thenReturn(null);

        // WHEN
        handler.afterConnectionEstablished(mockSession);

        // THEN: Bị đóng với BAD_DATA status
        verify(mockSession, times(1)).close(CloseStatus.BAD_DATA);
    }

    @Test
    @DisplayName("afterConnectionClosed — Nên dọn dẹp session khi kết nối đóng")
    void afterConnectionClosed_ShouldCleanUp() throws Exception {
        // GIVEN
        URI uri = new URI("ws://localhost:8080/api/ws/notifications?userId=123");
        when(mockSession.getUri()).thenReturn(uri);
        handler.afterConnectionEstablished(mockSession);

        // WHEN
        handler.afterConnectionClosed(mockSession, CloseStatus.NORMAL);

        // THEN: sendToUser sẽ không gửi được nữa vì session đã bị remove khỏi map tĩnh
        reset(mockSession);
        NotificationWebSocketHandler.sendToUser(123L, "{\"message\":\"Hello\"}");
        verify(mockSession, never()).sendMessage(any(TextMessage.class));
    }

    @Test
    @DisplayName("sendToUser — Nên thực thi và gửi tin nhắn cực nhanh dưới 1 giây (1000ms)")
    void sendToUser_ExecutionTime_ShouldBeUnderOneSecond() throws Exception {
        // GIVEN
        URI uri = new URI("ws://localhost:8080/api/ws/notifications?userId=123");
        when(mockSession.getUri()).thenReturn(uri);
        when(mockSession.isOpen()).thenReturn(true);
        handler.afterConnectionEstablished(mockSession);

        // WHEN: Đo thời gian thực thi của sendToUser
        long startTime = System.currentTimeMillis();
        NotificationWebSocketHandler.sendToUser(123L, "{\"message\":\"Speed Test\"}");
        long duration = System.currentTimeMillis() - startTime;

        // THEN: Thời gian thực thi gửi WebSocket phải nhỏ hơn 1000ms
        assertThat(duration).isLessThan(1000L);
        verify(mockSession, times(1)).sendMessage(any(TextMessage.class));
    }
}
