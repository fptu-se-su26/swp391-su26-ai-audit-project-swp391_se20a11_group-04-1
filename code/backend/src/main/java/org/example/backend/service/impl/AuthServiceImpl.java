package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserAccountRepository userAccountRepository;
    private final SystemRoleRepository systemRoleRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

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
}
