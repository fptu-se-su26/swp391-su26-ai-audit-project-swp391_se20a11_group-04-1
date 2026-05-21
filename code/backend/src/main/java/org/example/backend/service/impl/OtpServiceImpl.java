package org.example.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.RegisterRequest;
import org.example.backend.exception.BadRequestException;
import org.example.backend.service.OtpService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String OTP_KEY_PREFIX = "OTP:";
    private static final String REG_KEY_PREFIX = "REG:";

    @Override
    public String generateOtp() {
        int otp = 100000 + secureRandom.nextInt(900000); // 100000 to 999999
        return String.valueOf(otp);
    }

    @Override
    public void saveOtpAndRequest(String email, String otp, RegisterRequest request, long ttlMinutes) {
        String otpKey = OTP_KEY_PREFIX + email;
        String regKey = REG_KEY_PREFIX + email;

        try {
            // Serialize DTO to JSON
            String requestJson = objectMapper.writeValueAsString(request);
            
            // Save to Redis with expiration time
            redisTemplate.opsForValue().set(otpKey, otp, ttlMinutes, TimeUnit.MINUTES);
            redisTemplate.opsForValue().set(regKey, requestJson, ttlMinutes, TimeUnit.MINUTES);
            
            log.info("Successfully cached OTP and Registration DTO for email: {}", email);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize Registration Request for email: {}", email, e);
            throw new BadRequestException("Failed to process registration data");
        }
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        String otpKey = OTP_KEY_PREFIX + email;
        String cachedOtp = redisTemplate.opsForValue().get(otpKey);
        
        return cachedOtp != null && cachedOtp.equals(otp);
    }

    @Override
    public RegisterRequest getRegistrationRequest(String email) {
        String regKey = REG_KEY_PREFIX + email;
        String requestJson = redisTemplate.opsForValue().get(regKey);
        
        if (requestJson == null) {
            log.warn("Registration request not found or expired for email: {}", email);
            throw new BadRequestException("Registration request has expired or does not exist");
        }

        try {
            return objectMapper.readValue(requestJson, RegisterRequest.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize Registration Request for email: {}", email, e);
            throw new BadRequestException("Failed to restore registration data");
        }
    }

    @Override
    public void clearOtpAndRequest(String email) {
        String otpKey = OTP_KEY_PREFIX + email;
        String regKey = REG_KEY_PREFIX + email;

        redisTemplate.delete(otpKey);
        redisTemplate.delete(regKey);
        log.info("Cleared cached registration keys for email: {}", email);
    }
}
