package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpSession;
import org.example.backend.dto.RegisterRequest;
import org.example.backend.dto.UserResponse;
import org.example.backend.dto.VerifyOtpRequest;
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
import org.example.backend.service.AuthService;
import org.example.backend.service.EmailService;
import org.example.backend.service.OtpService;
import org.example.backend.service.RateLimitService;
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

    @Override
    public void requestRegistration(RegisterRequest request) {
        log.info("Received account registration request for username: {}, email: {}", request.getUsername(),
                request.getEmail());

        // 1. Verify unique criteria in PostgreSQL
        if (userAccountRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration request failed. Username already exists: {}", request.getUsername());
            throw new DuplicateResourceException("Username is already taken");
        }

        if (userAccountRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration request failed. Email already exists: {}", request.getEmail());
            throw new DuplicateResourceException("Email is already registered");
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
    public UserResponse login(String usernameOrEmail, String password, HttpSession session, String ipAddress) {
        log.info("Processing login request for username/email: {} from IP: {}", usernameOrEmail, ipAddress);

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

        // BƯỚC 1: Ngắt mạch sớm tài khoản (Khóa mềm tài khoản)
        Boolean isLocked = redisTemplate.hasKey(lockKey);
        if (Boolean.TRUE.equals(isLocked)) {
            Long expireSeconds = redisTemplate.getExpire(lockKey, TimeUnit.SECONDS);
            long expireMinutes = (expireSeconds != null && expireSeconds > 0) ? (expireSeconds + 59) / 60 : 5;

            log.warn("Login fast-failed. Account is currently locked on Redis: {}", usernameOrEmail);
            throw new CustomException(
                    String.format("Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau %d phút.", expireMinutes),
                    HttpStatus.LOCKED);
        }

        // BƯỚC 2: Truy vấn PostgreSQL kiểm tra xem User có tồn tại không.
        // Chỉ lưu log đếm sai khi User thật tồn tại để tránh hacker spam tràn RAM
        // Redis!
        UserAccount user = userAccountRepository.findByUsernameOrEmail(usernameOrEmail)
                .orElseThrow(() -> {
                    log.warn("Login failed. User not found in DB: {}", usernameOrEmail);
                    throw new UnauthorizedException("Thông tin đăng nhập không chính xác.");
                });

        // BƯỚC 3: So khớp mật khẩu
        boolean matches = passwordEncoder.matches(password, user.getPasswordHash());

        if (matches) {
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

            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
            session.setAttribute("userId", user.getId());
            session.setAttribute("userRole", roleName);
            session.setAttribute("email", user.getEmail());
            session.setAttribute("fullName", user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername());

            log.info("User {} successfully authenticated and session bound.", user.getUsername());

            return UserResponse.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername())
                    .systemRole(roleName)
                    .isActive(user.isActive())
                    .createdAt(user.getCreatedAt())
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
                    String unlockLink = "http://localhost:8080/api/v1/auth/unlock?token=" + unlockToken;
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
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getProfile() != null ? user.getProfile().getFullName() : user.getUsername())
                .systemRole(user.getSystemRole() != null ? user.getSystemRole().getName() : "USER")
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
