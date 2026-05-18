package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpSession;
import org.example.backend.dto.RegisterRequest;
import org.example.backend.dto.UserResponse;
import org.example.backend.dto.VerifyOtpRequest;
import org.example.backend.entity.SystemRole;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.UserProfile;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.SystemRoleRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.AuthService;
import org.example.backend.service.EmailService;
import org.example.backend.service.OtpService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserAccountRepository userAccountRepository;
    private final SystemRoleRepository systemRoleRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    @Override
    public void requestRegistration(RegisterRequest request) {
        log.info("Received account registration request for username: {}, email: {}", request.getUsername(), request.getEmail());

        // 1. Verify unique criteria in PostgreSQL
        if (userAccountRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration request failed. Username already exists: {}", request.getUsername());
            throw new CustomException.ConflictException("Username is already taken");
        }

        if (userAccountRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration request failed. Email already exists: {}", request.getEmail());
            throw new CustomException.ConflictException("Email is already registered");
        }

        // 2. Generate secure random OTP
        String otp = otpService.generateOtp();

        // 3. Cache OTP and DTO to Redis for 5 minutes
        otpService.saveOtpAndRequest(request.getEmail(), otp, request, 5);

        // 4. Send beautiful HTML OTP email
        emailService.sendOtpEmail(request.getEmail(), otp);
        log.info("Successfully processed step 1 registration for: {}", request.getEmail());
    }

    @Override
    @Transactional
    public UserResponse verifyOtpAndRegister(VerifyOtpRequest request) {
        log.info("Processing OTP verification for email: {}", request.getEmail());

        // 1. Validate OTP from Redis
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            log.warn("Invalid or expired OTP provided for email: {}", request.getEmail());
            throw new CustomException.BadRequestException("Invalid or expired OTP code");
        }

        // 2. Load cached registration request DTO from Redis
        RegisterRequest regData = otpService.getRegistrationRequest(request.getEmail());

        // 3. Fetch default 'USER' system role from database
        SystemRole defaultRole = systemRoleRepository.findByName("USER")
                .orElseThrow(() -> {
                    log.error("Critical System Configuration Error: Default role 'USER' is not initialized");
                    return new CustomException.ResourceNotFoundException("Default system role 'USER' not found");
                });

        // 4. Create new UserAccount entity with hashed password
        UserAccount userAccount = UserAccount.builder()
                .username(regData.getUsername())
                .email(regData.getEmail())
                .passwordHash(passwordEncoder.encode(regData.getPassword()))
                .systemRole(defaultRole)
                .isActive(true)
                .build();

        // 5. Create new UserProfile entity
        UserProfile userProfile = UserProfile.builder()
                .fullName(regData.getFullName())
                .phone(regData.getPhone())
                .build();

        // 6. Bind bidirectional relationship
        userAccount.setProfile(userProfile);

        // 7. Save UserAccount (automatically cascades to save UserProfile because of cascade=CascadeType.ALL)
        UserAccount savedAccount = userAccountRepository.save(userAccount);
        log.info("Successfully persisted new user account with ID: {}", savedAccount.getId());

        // 8. Clean up Redis cache keys
        otpService.clearOtpAndRequest(request.getEmail());

        // 9. Convert saved entity to DTO and return to controller
        return UserResponse.builder()
                .id(savedAccount.getId())
                .username(savedAccount.getUsername())
                .email(savedAccount.getEmail())
                .fullName(savedAccount.getProfile().getFullName())
                .phone(savedAccount.getProfile().getPhone())
                .systemRole(savedAccount.getSystemRole().getName())
                .isActive(savedAccount.isActive())
                .createdAt(savedAccount.getCreatedAt())
                .build();
    }

    @Override
    public UserResponse login(String usernameOrEmail, String password, HttpSession session) {
        log.info("Processing login request for username/email: {}", usernameOrEmail);

        // Cấu hình các Key trên Redis
        String lockKey = "login:lock:" + usernameOrEmail;
        String attemptKey = "login:attempts:" + usernameOrEmail;

        // BƯỚC 1: Ngắt mạch sớm (Fast-Fail)
        // Kiểm tra xem tài khoản có đang bị khóa tạm thời trong Redis không
        Boolean isLocked = redisTemplate.hasKey(lockKey);
        if (Boolean.TRUE.equals(isLocked)) {
            // Lấy thời gian khóa còn lại (TTL tính theo giây)
            Long expireSeconds = redisTemplate.getExpire(lockKey, TimeUnit.SECONDS);
            long expireMinutes = (expireSeconds != null && expireSeconds > 0) ? (expireSeconds + 59) / 60 : 5;
            
            log.warn("Login fast-failed. Account is currently locked on Redis: {}", usernameOrEmail);
            throw new CustomException(
                String.format("Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau %d phút.", expireMinutes),
                HttpStatus.LOCKED
            );
        }

        // BƯỚC 2: Truy vấn PostgreSQL để kiểm tra sự tồn tại của User (Không dùng nối chuỗi)
        UserAccount user = userAccountRepository.findByUsernameOrEmail(usernameOrEmail)
                .orElseThrow(() -> {
                    log.warn("Login failed. User not found in DB: {}", usernameOrEmail);
                    throw new CustomException("Thông tin đăng nhập không chính xác.", HttpStatus.UNAUTHORIZED);
                });

        // BƯỚC 3: So khớp mật khẩu bằng passwordEncoder.matches()
        boolean matches = passwordEncoder.matches(password, user.getPasswordHash());

        if (matches) {
            // Đăng nhập thành công! Xóa hoàn toàn các Key nháp lưu trạng thái thất bại trên Redis
            redisTemplate.delete(attemptKey);
            redisTemplate.delete(lockKey);

            // Lưu thông tin vào HttpSession truyền thống (Session-based)
            String roleName = user.getSystemRole() != null ? user.getSystemRole().getName() : "USER";
            
            // 1. Tạo đối tượng Authentication đại diện cho phiên đăng nhập
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(),
                null,
                AuthorityUtils.createAuthorityList("ROLE_" + roleName)
            );
            
            // 2. Thiết lập SecurityContext
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            
            // 3. Đưa SecurityContext vào HttpSession theo chuẩn Spring Security
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
            
            // 4. Lưu thêm thông tin định danh cực nhẹ (userId, userRole) vào Session thay vì lưu cả đối tượng Entity cồng kềnh
            session.setAttribute("userId", user.getId());
            session.setAttribute("userRole", roleName);

            log.info("User {} successfully authenticated and session bound.", user.getUsername());

            return UserResponse.builder()
                    .id(user.getId())
                    .systemRole(roleName)
                    .build();
        } else {
            // Đăng nhập thất bại: Tăng số lần sai trong Redis lên 1 (sử dụng increment)
            Long attempts = redisTemplate.opsForValue().increment(attemptKey);
            
            // Thiết lập thời gian tự hủy (TTL) cho Key attempt là 24 giờ
            redisTemplate.expire(attemptKey, 24, TimeUnit.HOURS);

            log.warn("Login failed. Incorrect password for user: {}. Current attempts: {}", usernameOrEmail, attempts);

            if (attempts != null && attempts >= 3 && (attempts - 3) % 2 == 0) {
                // Tính toán Lock Level và Thời gian khóa
                long level = (attempts - 3) / 2 + 1;
                long lockTimeMinutes = level * 5;

                // Tạo Key lock trên Redis với giá trị "true" và TTL tương ứng (lockTimeMinutes phút)
                redisTemplate.opsForValue().set(lockKey, "true", lockTimeMinutes, TimeUnit.MINUTES);

                log.warn("Account {} is locked for {} minutes due to {} failed attempts (Lock Level: {}).",
                        usernameOrEmail, lockTimeMinutes, attempts, level);

                // Tích hợp gửi email cảnh báo bảo mật bất đồng bộ (Fail-safe)
                try {
                    String targetEmail = user.getEmail();
                    String username = user.getUsername();
                    emailService.sendSecurityAlertEmail(targetEmail, username, attempts.intValue(), lockTimeMinutes);
                    log.info("Successfully triggered async security alert email to: {}", targetEmail);
                } catch (Exception mailEx) {
                    log.error("Fail-safe catch: Failed to trigger security alert email for: {}", usernameOrEmail, mailEx);
                }

                throw new CustomException(
                    String.format("Tài khoản của bạn đã bị khóa tạm thời trong %d phút do nhập sai mật khẩu %d lần.", lockTimeMinutes, attempts),
                    HttpStatus.LOCKED
                );
            }

            // Các trường hợp sai mật khẩu thông thường khác (sai lần 1, 2, 4, 6...)
            throw new CustomException("Thông tin đăng nhập không chính xác.", HttpStatus.UNAUTHORIZED);
        }
    }
}
