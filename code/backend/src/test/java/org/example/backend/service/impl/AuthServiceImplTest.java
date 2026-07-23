package org.example.backend.service.impl;

import jakarta.servlet.http.HttpSession;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.UserAppeal;
import org.example.backend.exception.CustomException;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.exception.UnauthorizedException;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.UserAppealRepository;
import org.example.backend.service.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserAccountRepository userAccountRepository;
    @Mock private UserAppealRepository userAppealRepository;
    @Mock private RateLimitService rateLimitService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private HttpSession session;
    @Mock private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthServiceImpl authService;

    private UserAccount mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new UserAccount();
        mockUser.setId(1L);
        mockUser.setUsername("testuser");
        mockUser.setEmail("test@gmail.com");
        mockUser.setPasswordHash("hashed_pass");
        mockUser.setActive(true);
    }

    // Nhánh 1: Cấm IP
    @Test
    void testLogin_IpBlacklisted_ThrowsForbiddenException() {
        when(rateLimitService.isIpBlacklisted("127.0.0.1")).thenReturn(true);

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> 
            authService.login("testuser", "pass", false, session, "127.0.0.1")
        );
        assertTrue(ex.getMessage().contains("bị cấm truy cập hệ thống vĩnh viễn"));
    }

    // Nhánh 2: Account khóa toàn cầu
    @Test
    void testLogin_GlobalLocked_ThrowsCustomException() {
        when(rateLimitService.isIpBlacklisted("127.0.0.1")).thenReturn(false);
        when(rateLimitService.isIpWhitelisted("testuser", "127.0.0.1")).thenReturn(false);
        when(rateLimitService.isGlobalLocked("testuser")).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> 
            authService.login("testuser", "pass", false, session, "127.0.0.1")
        );
        assertEquals(HttpStatus.LOCKED, ex.getStatus());
    }

    // Nhánh 3: User không tồn tại hoặc sai username
    @Test
    void testLogin_UserNotFound_ThrowsUnauthorizedException() {
        when(rateLimitService.isIpBlacklisted("127.0.0.1")).thenReturn(false);
        when(rateLimitService.isIpWhitelisted("testuser", "127.0.0.1")).thenReturn(false);
        when(rateLimitService.isGlobalLocked("testuser")).thenReturn(false);
        when(userAccountRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () -> 
            authService.login("testuser", "pass", false, session, "127.0.0.1")
        );
    }

    // Nhánh 4: User bị khóa (Inactive)
    @Test
    void testLogin_UserInactive_ThrowsCustomException() {
        mockUser.setActive(false);
        when(rateLimitService.isIpBlacklisted("127.0.0.1")).thenReturn(false);
        when(rateLimitService.isIpWhitelisted("testuser", "127.0.0.1")).thenReturn(false);
        when(rateLimitService.isGlobalLocked("testuser")).thenReturn(false);
        when(userAccountRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(mockUser));
        when(userAppealRepository.findFirstByUserIdOrderByIdDesc(mockUser.getId())).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> 
            authService.login("testuser", "pass", false, session, "127.0.0.1")
        );
        assertEquals(HttpStatus.LOCKED, ex.getStatus());
    }

    // Nhánh 5: User bình thường, nhưng sai password
    @Test
    void testLogin_WrongPassword_ThrowsUnauthorizedException() {
        when(rateLimitService.isIpBlacklisted("127.0.0.1")).thenReturn(false);
        when(rateLimitService.isIpWhitelisted("testuser", "127.0.0.1")).thenReturn(false);
        when(rateLimitService.isGlobalLocked("testuser")).thenReturn(false);
        when(userAccountRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(mockUser));
        when(redisTemplate.hasKey("login:lock:testuser")).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(passwordEncoder.matches("wrongpass", "hashed_pass")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> 
            authService.login("testuser", "wrongpass", false, session, "127.0.0.1")
        );
    }
}
