package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpSession;
import org.example.backend.dto.RegisterRequest;
import org.example.backend.dto.UserResponse;
import org.example.backend.dto.VerifyOtpRequest;
import org.example.backend.dto.ResetPasswordRequest;
import org.example.backend.entity.SystemRole;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.UserProfile;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.CustomException;
import org.example.backend.exception.DuplicateResourceException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.exception.UnauthorizedException;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.repository.SystemRoleRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.UserAppealRepository;
import org.example.backend.repository.UserGithubTokenRepository;
import org.example.backend.entity.UserAppeal;
import org.example.backend.entity.UserGithubToken;
import org.example.backend.service.AuthService;
import org.example.backend.service.EmailService;
import org.example.backend.service.OtpService;
import org.example.backend.service.RateLimitService;
import org.example.backend.service.EncryptionService;
import java.util.UUID;
import java.util.Optional;
import java.time.LocalDateTime;
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
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.HashMap;
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
    private final RateLimitService rateLimitService;
    private final org.example.backend.service.MentorVerificationService mentorVerificationService;
    private final UserAppealRepository userAppealRepository;
    private final UserGithubTokenRepository userGithubTokenRepository;
    private final EncryptionService encryptionService;

    @org.springframework.beans.factory.annotation.Value("${app.api-base-url:http://localhost:8080}")
    private String apiBaseUrl;

    @Override
    public void requestRegistration(RegisterRequest request) {
        log.info("Received account registration request for username: {}, email: {}", request.getUsername(),
                request.getEmail());

        // 0. Check rate limit: maximum 3 requests per email per 24 hours
        String limitKey = "REG_LIMIT:" + request.getEmail();
        String countStr = redisTemplate.opsForValue().get(limitKey);
        int count = countStr == null ? 0 : Integer.parseInt(countStr);

        if (count >= 3) {
            log.warn("Registration OTP request rejected. Email {} has exceeded daily limit of 3 requests.", request.getEmail());
            throw new BadRequestException("Bạn đã vượt quá giới hạn 3 yêu cầu gửi mã OTP đăng ký trong ngày. Vui lòng quay lại sau 24 giờ.");
        }

        // 1. Verify unique criteria in PostgreSQL
        if (userAccountRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration request failed. Username already exists: {}", request.getUsername());
            throw new DuplicateResourceException("Username is already taken");
        }

        if (userAccountRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration request failed. Email already exists: {}", request.getEmail());
            throw new DuplicateResourceException("Email is already registered");
        }

        // Increment the limit count in Redis
        if (count == 0) {
            redisTemplate.opsForValue().set(limitKey, "1", 24, TimeUnit.HOURS);
        } else {
            redisTemplate.opsForValue().increment(limitKey);
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
            throw new BadRequestException("Invalid or expired OTP code");
        }

        // 2. Load cached registration request DTO from Redis
        RegisterRequest regData = otpService.getRegistrationRequest(request.getEmail());

        // 3. Fetch default 'USER' system role from database
        SystemRole defaultRole = systemRoleRepository.findByName("USER")
                .orElseThrow(() -> {
                    log.error("Critical System Configuration Error: Default role 'USER' is not initialized");
                    return new ResourceNotFoundException("Default system role 'USER' not found");
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

        // 7. Save UserAccount (automatically cascades to save UserProfile because of
        // cascade=CascadeType.ALL)
        UserAccount savedAccount = userAccountRepository.save(userAccount);
        log.info("Successfully persisted new user account with ID: {}", savedAccount.getId());

        // 8. Clean up Redis cache keys
        otpService.clearOtpAndRequest(request.getEmail());
        redisTemplate.delete("REG_LIMIT:" + request.getEmail());

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
                .passwordSet(isPasswordSet(savedAccount))
                .build();
    }

    @Override
    public UserResponse login(String usernameOrEmail, String password, boolean rememberMe, HttpSession session, String ipAddress) {
        log.info("Processing login request for username/email: {} from IP: {} (RememberMe: {})", usernameOrEmail, ipAddress, rememberMe);

        // BƯỚC 0: IP Rate Limiting (Chống DDoS / spam requests)
        rateLimitService.checkRateLimit(ipAddress, "login", 5, 1);

        // BƯỚC 0.1: Kiểm tra IP Blacklist vĩnh viễn (IP của hacker đã bị cấm)
        if (rateLimitService.isIpBlacklisted(ipAddress)) {
            log.warn("Login blocked. IP {} is permanently blacklisted.", ipAddress);
            throw new ForbiddenException("Địa chỉ IP của bạn bị cấm truy cập hệ thống vĩnh viễn do vi phạm an ninh.");
        }

        // BƯỚC 0.2: Kiểm tra IP Whitelist. Nếu đã được Whitelist -> Bỏ qua kiểm tra IP
        // Lock mềm!
        boolean isWhitelisted = rateLimitService.isIpWhitelisted(usernameOrEmail, ipAddress);
        if (!isWhitelisted) {
            rateLimitService.checkIpLock(ipAddress, "login");
        }

        // BƯỚC 0.3: Kiểm tra Khóa Toàn Cầu của tài khoản
        if (rateLimitService.isGlobalLocked(usernameOrEmail)) {
            log.warn("Login blocked. Account {} is globally locked.", usernameOrEmail);
            throw new CustomException(
                    "Tài khoản của bạn đã bị khóa cứng trên toàn cầu do phát hiện hoạt động dò quét xâm nhập. Vui lòng kiểm tra email bảo mật để xác minh danh tính.",
                    HttpStatus.LOCKED);
        }

        // Cấu hình các Key trên Redis của tài khoản
        String lockKey = "login:lock:" + usernameOrEmail;
        String attemptKey = "login:attempts:" + usernameOrEmail;

        // BƯỚC 1: Truy vấn PostgreSQL kiểm tra xem User có tồn tại không và có bị khóa vĩnh viễn không.
        UserAccount user = userAccountRepository.findByUsernameOrEmail(usernameOrEmail)
                .orElseThrow(() -> {
                    log.warn("Login failed. User not found in DB: {}", usernameOrEmail);
                    throw new UnauthorizedException("Incorrect username or password.");
                });

        if (!user.isActive()) {
            UserAppeal latestAppeal = userAppealRepository.findFirstByUserIdOrderByIdDesc(user.getId()).orElse(null);
            String extraMsg = "";
            if (latestAppeal != null) {
                if ("PENDING".equalsIgnoreCase(latestAppeal.getStatus())) {
                    extraMsg = " (Đơn kháng cáo của bạn đang được xử lý...)";
                } else if ("REJECTED".equalsIgnoreCase(latestAppeal.getStatus())) {
                    String comment = latestAppeal.getAdminComment();
                    if (comment != null && !comment.trim().isEmpty()) {
                        extraMsg = " | Phản hồi từ Admin về kháng cáo bị từ chối: " + comment;
                    }
                }
            }
            throw new CustomException(
                "Tài khoản của bạn đã bị admin khóa với lí do: " + (user.getLockReason() != null ? user.getLockReason() : "Không có lý do cụ thể") + extraMsg,
                HttpStatus.LOCKED
            );
        }

        // BƯỚC 2: Ngắt mạch sớm tài khoản (Khóa mềm tài khoản do nhập sai mật khẩu nhiều lần)
        Boolean isLocked = redisTemplate.hasKey(lockKey);
        if (Boolean.TRUE.equals(isLocked)) {
            Long expireSeconds = redisTemplate.getExpire(lockKey, TimeUnit.SECONDS);
            long expireMinutes = (expireSeconds != null && expireSeconds > 0) ? (expireSeconds + 59) / 60 : 5;

            log.warn("Login fast-failed. Account is currently locked on Redis: {}", usernameOrEmail);
            throw new CustomException(
                    String.format("Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau %d phút.", expireMinutes),
                    HttpStatus.LOCKED);
        }

        // BƯỚC 3: So khớp mật khẩu
        boolean matches = passwordEncoder.matches(password, user.getPasswordHash());

        if (matches) {
            checkAndExpireVerification(user);
            // Đăng nhập thành công! Giải phóng các bộ đếm và khóa
            redisTemplate.delete(attemptKey);
            redisTemplate.delete(lockKey);

            // CHỈ xóa lịch sử thất bại và khóa của CHÍNH thiết bị vừa đăng nhập thành công này
            rateLimitService.clearFailureCount(ipAddress, "login");

            // Giải phóng Khóa Toàn Cầu và xóa danh sách lưu thông tin IP lỗi của tài khoản để đưa tài khoản về trạng thái sạch sẽ
            rateLimitService.unlockGlobally(user.getUsername());

            String roleName = user.getSystemRole() != null ? user.getSystemRole().getName() : "USER";

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    user.getUsername(),
                    null,
                    AuthorityUtils.createAuthorityList("ROLE_" + roleName));

            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);

            // Configure session timeout based on Remember Me preference
            if (rememberMe) {
                // 7 days in seconds = 7 * 24 * 60 * 60 = 604800
                session.setMaxInactiveInterval(7 * 24 * 60 * 60);
            } else {
                // Default session timeout = 30 minutes = 30 * 60 = 1800
                session.setMaxInactiveInterval(30 * 60);
            }

            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
            session.setAttribute("userId", user.getId());
            session.setAttribute("username", user.getUsername());
            session.setAttribute("userRole", roleName);
            session.setAttribute("email", user.getEmail());
            session.setAttribute("fullName", user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername());

            org.example.backend.config.SessionRegistryListener.register(user.getId(), session);

            log.info("User {} successfully authenticated and session bound.", user.getUsername());

            return UserResponse.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername())
                    .systemRole(roleName)
                    .isActive(user.isActive())
                    .verifyStatus(user.getVerifyStatus() != null ? user.getVerifyStatus().name() : "UNVERIFIED")
                    .createdAt(user.getCreatedAt())
                    .lockReason(user.getLockReason())
                    .passwordSet(isPasswordSet(user))
                    .build();
        } else {
            // Đăng nhập thất bại -> Phân tích thiết bị và vị trí
            String userAgent = "Unknown Device";
            try {
                ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                        .getRequestAttributes();
                if (attributes != null) {
                    String ua = attributes.getRequest().getHeader("User-Agent");
                    if (ua != null) {
                        userAgent = parseUserAgent(ua);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to parse User-Agent", e);
            }

            String location = getIpLocation(ipAddress);

            // Lưu thông tin IP gõ sai vào Redis Hash
            rateLimitService.recordFailedIpInfo(user.getUsername(), ipAddress, userAgent, location);

            // Ghi nhận IP đăng nhập lỗi mềm (Fast Lock IP nếu IP này sai 3 lần)
            rateLimitService.recordIpFailure(ipAddress, "login", 3, 30);

            // Tăng số lần gõ sai của riêng tài khoản này
            Long attempts = redisTemplate.opsForValue().increment(attemptKey);
            redisTemplate.expire(attemptKey, 24, TimeUnit.HOURS);

            log.warn("Login failed. Incorrect password for user: {}. Current attempts: {}", usernameOrEmail, attempts);

            // Kiểm tra số lượng IP vi phạm của tài khoản này
            Map<String, String> failedIpsMap = rateLimitService.getFailedIpsInfo(user.getUsername());

            if (failedIpsMap.size() >= 2) {
                // PHÁT HIỆN TẤN CÔNG ĐA IP (BOTNET / DISTRIBUTED ATTACK) -> KHÓA CỨNG TOÀN CẦU!
                rateLimitService.lockGlobally(user.getUsername());

                // Tạo token Whitelist và token Block riêng biệt cho từng IP vi phạm
                Map<String, String> unlockTokensMap = new HashMap<>();
                Map<String, String> blockTokensMap = new HashMap<>();
                for (String failedIp : failedIpsMap.keySet()) {
                    unlockTokensMap.put(failedIp, rateLimitService.createUnlockToken(user.getUsername(), failedIp));
                    blockTokensMap.put(failedIp, rateLimitService.createBlockToken(failedIp));
                }

                // Gửi Email khẩn cấp (Danger Theme)
                try {
                    emailService.sendEmergencyAttackAlertEmail(user.getEmail(), user.getUsername(), failedIpsMap,
                            unlockTokensMap, blockTokensMap);
                    log.info("Successfully triggered async emergency multi-IP attack email to: {}", user.getEmail());
                } catch (Exception mailEx) {
                    log.error("Failed to trigger emergency email", mailEx);
                }

                throw new CustomException(
                        "Tài khoản của bạn đã bị khóa cứng trên toàn cầu do phát hiện hoạt động dò quét xâm nhập từ nhiều thiết bị lạ. Vui lòng kiểm tra email bảo mật để xác nhận danh tính.",
                        HttpStatus.LOCKED);
            }

            // Nếu chỉ có 1 IP vi phạm, thực hiện khóa mềm tài khoản theo chu kỳ gõ sai
            // (nhập sai 3 lần, 5 lần, 7 lần...)
            if (attempts != null && attempts >= 3 && (attempts - 3) % 2 == 0) {
                long level = (attempts - 3) / 2 + 1;
                long lockTimeMinutes = level * 5;

                redisTemplate.opsForValue().set(lockKey, "true", lockTimeMinutes, TimeUnit.MINUTES);
                log.warn("Account {} is locked for {} minutes due to {} failed attempts (Lock Level: {}).",
                        usernameOrEmail, lockTimeMinutes, attempts, level);

                // Gửi email cảnh báo bảo mật đơn lẻ có kèm nút bấm Whitelist được mã hóa theo
                // IP hiện tại
                try {
                    String unlockToken = rateLimitService.createUnlockToken(user.getUsername(), ipAddress);
                    String unlockLink = apiBaseUrl + "/api/v1/auth/unlock?token=" + unlockToken;
                    emailService.sendSecurityAlertEmail(user.getEmail(), user.getUsername(), attempts.intValue(),
                            lockTimeMinutes, userAgent, location, unlockLink);
                    log.info("Successfully triggered async security alert email to: {}", user.getEmail());
                } catch (Exception mailEx) {
                    log.error("Failed to trigger security alert email", mailEx);
                }

                throw new CustomException(
                        String.format(
                                "Tài khoản của bạn đã bị khóa tạm thời trong %d phút do nhập sai mật khẩu %d lần.",
                                lockTimeMinutes, attempts),
                        HttpStatus.LOCKED);
            }

            throw new UnauthorizedException("Thông tin đăng nhập không chính xác.");
        }
    }

    @Override
    public String unlockAccountByToken(String token) {
        String tokenVal = rateLimitService.getUsernameAndIpByUnlockToken(token);
        if (tokenVal == null) {
            throw new BadRequestException("Liên kết xác nhận đã hết hạn hoặc không hợp lệ.");
        }

        String[] parts = tokenVal.split(":", 2);
        String username = parts[0];
        String ipAddress = parts[1];

        // Whitelist IP của sếp trong 24h
        rateLimitService.whitelistIp(username, ipAddress);

        // Giải phóng Khóa Toàn Cầu
        rateLimitService.unlockGlobally(username);

        // Giải phóng Khóa IP mềm của IP này
        rateLimitService.clearFailureCount(ipAddress, "login");

        // Lấy chi tiết thiết bị để hiển thị
        String deviceInfo = "IP: " + ipAddress;
        Map<String, String> ipInfo = rateLimitService.getFailedIpsInfo(username);
        if (ipInfo.containsKey(ipAddress)) {
            deviceInfo = ipAddress + " - " + ipInfo.get(ipAddress);
        }
        return deviceInfo;
    }

    @Override
    public String blockIpByToken(String token) {
        String ipAddress = rateLimitService.getIpByBlockToken(token);
        if (ipAddress == null) {
            throw new BadRequestException("Liên kết chặn IP đã hết hạn hoặc không hợp lệ.");
        }

        // Đưa IP của hacker vào Blacklist vĩnh viễn
        rateLimitService.blacklistIp(ipAddress);

        // Giải phóng Khóa IP mềm
        rateLimitService.clearFailureCount(ipAddress, "login");

        return ipAddress;
    }

    private String parseUserAgent(String ua) {
        if (ua.contains("Windows"))
            return "Windows PC";
        if (ua.contains("Macintosh") || ua.contains("Mac OS"))
            return "MacBook / macOS";
        if (ua.contains("iPhone"))
            return "iPhone / iOS";
        if (ua.contains("Android"))
            return "Android Phone";
        if (ua.contains("Linux"))
            return "Linux Device";
        return "Thiết bị không xác định";
    }

    private String getIpLocation(String ip) {
        if ("127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || ip.startsWith("192.168.")
                || ip.startsWith("10.")) {
            return "Localhost Development (Hà Nội, Việt Nam)";
        }
        try {
            RestTemplate restTemplate = new RestTemplate();
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(1500);
            requestFactory.setReadTimeout(1500);
            restTemplate.setRequestFactory(requestFactory);

            String url = "http://ip-api.com/json/" + ip;
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);
            if (response != null && "success".equals(response.get("status"))) {
                String city = String.valueOf(response.get("city"));
                String country = String.valueOf(response.get("country"));
                return city + ", " + country;
            }
        } catch (Exception e) {
            log.error("Failed to fetch GeoIP location for IP: {}", ip, e);
        }
        return "Vị trí không xác định";
    }

    @Override
    public UserResponse getCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Chưa đăng nhập hệ thống.", HttpStatus.UNAUTHORIZED);
        }
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("Tài khoản không tồn tại hoặc phiên đăng nhập đã hết hạn.", HttpStatus.UNAUTHORIZED));
        checkAndExpireVerification(user);
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername())
                .systemRole(user.getSystemRole() != null ? user.getSystemRole().getName() : "USER")
                .isActive(user.isActive())
                .verifyStatus(user.getVerifyStatus() != null ? user.getVerifyStatus().name() : "UNVERIFIED")
                .createdAt(user.getCreatedAt())
                .lockReason(user.getLockReason())
                .passwordSet(isPasswordSet(user))
                .build();
    }

    private void checkAndExpireVerification(UserAccount user) {
        mentorVerificationService.checkAndExpireVerification(user);
    }

    @Override
    public void submitAppeal(Long userId, String usernameOrEmail, String reason, String evidenceUrl, String evidenceName) {
        UserAccount user;
        if (userId != null) {
            user = userAccountRepository.findById(userId)
                    .orElseThrow(() -> new org.example.backend.exception.ResourceNotFoundException("Tài khoản không tồn tại."));
        } else if (usernameOrEmail != null && !usernameOrEmail.trim().isEmpty()) {
            user = userAccountRepository.findByUsernameOrEmail(usernameOrEmail)
                    .orElseThrow(() -> new org.example.backend.exception.ResourceNotFoundException("Không tìm thấy tài khoản với thông tin đã cung cấp."));
        } else {
            throw new org.example.backend.exception.BadRequestException("Thiếu thông tin xác thực tài khoản để gửi kháng cáo.");
        }
        
        if (user.isActive()) {
            throw new org.example.backend.exception.BadRequestException("Tài khoản này hiện không bị khóa, không cần gửi kháng cáo.");
        }

        // Kiểm tra xem đã có đơn kháng cáo nào đang PENDING của user này chưa để tránh trùng lặp
        userAppealRepository.findFirstByUserIdAndStatusOrderByIdDesc(user.getId(), "PENDING")
                .ifPresent(existing -> {
                    throw new org.example.backend.exception.BadRequestException("Bạn đã có đơn kháng cáo đang chờ xử lý.");
                });

        UserAppeal appeal = UserAppeal.builder()
                .user(user)
                .reason(reason)
                .evidenceUrl(evidenceUrl)
                .evidenceName(evidenceName)
                .status("PENDING")
                .build();
        
        userAppealRepository.save(appeal);
        
        // Broadcast the appeal submission in real-time to all active websocket sessions (including admins)
        String jsonPayload = String.format("{\"type\":\"APPEAL_SUBMITTED\",\"userId\":%d,\"username\":\"%s\"}", 
                user.getId(), user.getUsername());
        org.example.backend.config.NotificationWebSocketHandler.broadcast(jsonPayload);
    }

    @Override
    @Transactional
    public UserResponse loginWithGitHub(String email, String githubUsername, String avatarUrl, String accessToken, HttpSession session) {
        log.info("Processing GitHub OAuth login for email: {}, username: {}", email, githubUsername);

        // 1. Check if user already exists by email
        Optional<UserAccount> userOpt = userAccountRepository.findByEmail(email);
        UserAccount user;

        if (userOpt.isPresent()) {
            user = userOpt.get();
            // Check if user is active
            if (!user.isActive()) {
                throw new CustomException(
                    "Tài khoản của bạn đã bị admin khóa với lí do: " + (user.getLockReason() != null ? user.getLockReason() : "Không có lý do cụ thể"),
                    HttpStatus.LOCKED
                );
            }

            // Check if GitHub is linked for this user (Check if record exists in user_github_tokens)
            boolean isGitHubLinked = userGithubTokenRepository.existsById(user.getId());
            if (!isGitHubLinked) {
                // Scenario A2: Conflict. Registered via normal flow, never linked. Block!
                throw new CustomException(
                    "Email GitHub này đã được sử dụng để tạo tài khoản, vui lòng chọn tính năng lấy lại mật khẩu nếu bạn đã quên mật khẩu.",
                    HttpStatus.BAD_REQUEST
                );
            }
        } else {
            throw new ResourceNotFoundException("Tài khoản chưa được đăng ký trên hệ thống.");
        }

        // Save / update GitHub access token for the user
        UserGithubToken githubToken = userGithubTokenRepository.findById(user.getId())
                .orElse(UserGithubToken.builder().user(user).build());
        githubToken.setAccessTokenEncrypted(encryptionService.encrypt(accessToken));
        githubToken.setUpdatedAt(LocalDateTime.now());
        userGithubTokenRepository.save(githubToken);
        log.info("GitHub access token saved/updated for User ID: {}", user.getId());

        // Login & Session binding (similar to standard login)
        String roleName = user.getSystemRole() != null ? user.getSystemRole().getName() : "USER";

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(),
                null,
                AuthorityUtils.createAuthorityList("ROLE_" + roleName));

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);

        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
        session.setAttribute("userId", user.getId());
        session.setAttribute("userRole", roleName);
        session.setAttribute("email", user.getEmail());
        session.setAttribute("fullName", user.getProfile() != null && user.getProfile().getFullName() != null 
                ? user.getProfile().getFullName() : user.getUsername());

        org.example.backend.config.SessionRegistryListener.register(user.getId(), session);

        log.info("User {} successfully authenticated via GitHub and session bound.", user.getUsername());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername())
                .systemRole(roleName)
                .isActive(user.isActive())
                .verifyStatus(user.getVerifyStatus() != null ? user.getVerifyStatus().name() : "UNVERIFIED")
                .createdAt(user.getCreatedAt())
                .lockReason(user.getLockReason())
                .passwordSet(isPasswordSet(user))
                .build();
    }

    @Override
    public boolean existsByEmail(String email) {
        return userAccountRepository.existsByEmail(email);
    }

    @Override
    @Transactional
    public UserResponse registerWithGitHub(String email, String githubUsername, String avatarUrl, String accessToken, HttpSession session) {
        log.info("Registering new user via GitHub. Email: {}, Username: {}", email, githubUsername);
        
        if (userAccountRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email đã được sử dụng");
        }

        // Ensure username is unique
        String uniqueUsername = githubUsername;
        if (userAccountRepository.existsByUsername(uniqueUsername)) {
            uniqueUsername = githubUsername + "_" + UUID.randomUUID().toString().substring(0, 5);
        }

        SystemRole defaultRole = systemRoleRepository.findByName("USER")
                .orElseThrow(() -> new ResourceNotFoundException("Default system role 'USER' not found"));

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        long epochSecond = now.atZone(java.time.ZoneId.systemDefault()).toInstant().getEpochSecond();

        UserAccount user = UserAccount.builder()
                .username(uniqueUsername)
                .email(email)
                .passwordHash(passwordEncoder.encode(String.valueOf(epochSecond)))
                .systemRole(defaultRole)
                .isActive(true)
                .verifyStatus(org.example.backend.entity.VerifyStatus.UNVERIFIED) // OAuth users start as UNVERIFIED
                .createdAt(now)
                .build();

        UserProfile userProfile = UserProfile.builder()
                .fullName(githubUsername)
                .avatarUrl(avatarUrl)
                .build();

        user.setProfile(userProfile);
        user = userAccountRepository.save(user);

        // Save / update GitHub access token for the user
        UserGithubToken githubToken = userGithubTokenRepository.findById(user.getId())
                .orElse(UserGithubToken.builder().user(user).build());
        githubToken.setAccessTokenEncrypted(encryptionService.encrypt(accessToken));
        githubToken.setUpdatedAt(LocalDateTime.now());
        userGithubTokenRepository.save(githubToken);
        log.info("GitHub access token saved/updated for new User ID: {}", user.getId());

        // Login & Session binding
        String roleName = user.getSystemRole() != null ? user.getSystemRole().getName() : "USER";

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(),
                null,
                AuthorityUtils.createAuthorityList("ROLE_" + roleName));

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);

        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
        session.setAttribute("userId", user.getId());
        session.setAttribute("userRole", roleName);
        session.setAttribute("email", user.getEmail());
        session.setAttribute("fullName", user.getProfile() != null && user.getProfile().getFullName() != null 
                ? user.getProfile().getFullName() : user.getUsername());

        org.example.backend.config.SessionRegistryListener.register(user.getId(), session);

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername())
                .systemRole(roleName)
                .isActive(user.isActive())
                .verifyStatus(user.getVerifyStatus() != null ? user.getVerifyStatus().name() : "UNVERIFIED")
                .createdAt(user.getCreatedAt())
                .lockReason(user.getLockReason())
                .passwordSet(isPasswordSet(user))
                .build();
    }

    @Override
    public void requestForgotPassword(String email) {
        log.info("Received forgot password request for email: {}", email);

        // 1. Check rate limit: maximum 3 requests per email per 24 hours
        String limitKey = "FORGOT_LIMIT:" + email;
        String countStr = redisTemplate.opsForValue().get(limitKey);
        int count = countStr == null ? 0 : Integer.parseInt(countStr);

        if (count >= 3) {
            log.warn("Forgot password request rejected. Email {} has exceeded daily limit of 3 requests.", email);
            throw new BadRequestException("Bạn đã vượt quá giới hạn 3 yêu cầu gửi mã OTP khôi phục mật khẩu trong ngày. Vui lòng quay lại sau 24 giờ.");
        }

        // 2. Verify if user email exists in database
        UserAccount user = userAccountRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Forgot password request failed. Email does not exist: {}", email);
                    return new ResourceNotFoundException("Email không tồn tại trong hệ thống.");
                });

        // 3. Increment the limit count in Redis
        if (count == 0) {
            redisTemplate.opsForValue().set(limitKey, "1", 24, TimeUnit.HOURS);
        } else {
            redisTemplate.opsForValue().increment(limitKey);
        }

        // 4. Generate secure random 6-digit OTP
        String otp = otpService.generateOtp();

        // 5. Cache OTP only to Redis for 5 minutes
        otpService.saveOtpOnly(email, otp, 5);

        // 6. Send forgot password HTML OTP email
        emailService.sendForgotPasswordOtpEmail(email, otp);
        log.info("Successfully processed step 1 forgot password for: {}", email);
    }

    @Override
    public String verifyForgotPasswordOtp(String email, String otp) {
        log.info("Verifying forgot password OTP for email: {}", email);

        // 1. Validate OTP from Redis
        if (!otpService.verifyOtp(email, otp)) {
            log.warn("Invalid or expired OTP provided for email: {}", email);
            throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        // 2. Generate a secure random resetToken (UUID)
        String resetToken = UUID.randomUUID().toString();

        // 3. Cache resetToken in Redis for 5 minutes
        String resetTokenKey = "RESET_TOKEN:" + email;
        redisTemplate.opsForValue().set(resetTokenKey, resetToken, 5, TimeUnit.MINUTES);

        // 4. Clear the OTP in Redis so it cannot be reused
        otpService.clearOtpAndRequest(email);

        log.info("Successfully verified OTP and generated resetToken for email: {}", email);
        return resetToken;
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Processing password reset for email: {}", request.getEmail());

        // 1. Validate resetToken from Redis
        String resetTokenKey = "RESET_TOKEN:" + request.getEmail();
        String cachedToken = redisTemplate.opsForValue().get(resetTokenKey);

        if (cachedToken == null || !cachedToken.equals(request.getResetToken())) {
            log.warn("Invalid or expired reset token provided for email: {}", request.getEmail());
            throw new BadRequestException("Yêu cầu đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.");
        }

        // 2. Find user account
        UserAccount user = userAccountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        // 3. Hash and set new password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);
        log.info("Successfully updated password for user ID: {}", user.getId());

        // 4. Clean up Redis resetToken cache
        redisTemplate.delete(resetTokenKey);
    }

    private boolean isPasswordSet(UserAccount user) {
        if (user.getPasswordHash() == null || user.getCreatedAt() == null) {
            return true;
        }
        long epochSecond = user.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().getEpochSecond();
        return !passwordEncoder.matches(String.valueOf(epochSecond), user.getPasswordHash());
    }
}
