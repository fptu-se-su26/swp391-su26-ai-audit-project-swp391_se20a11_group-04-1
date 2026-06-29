package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.exception.CustomException;
import org.example.backend.service.RateLimitService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitServiceImpl implements RateLimitService {

    private final StringRedisTemplate redisTemplate;

    @Override
    public void checkRateLimit(String ipAddress, String actionName, int maxRequests, int durationInMinutes) {
        String rateKey = String.format("rate:%s:%s", actionName, ipAddress);

        // Tăng atomic số lượt request trên Redis
        Long currentRequests = redisTemplate.opsForValue().increment(rateKey);

        if (currentRequests != null && currentRequests == 1) {
            // Thiết lập TTL cho IP lần đầu truy cập trong chu kỳ
            redisTemplate.expire(rateKey, durationInMinutes, TimeUnit.MINUTES);
        }

        if (currentRequests != null && currentRequests > maxRequests) {
            log.warn("IP {} has exceeded the rate limit for action {}. ({} requests)", ipAddress, actionName, currentRequests);
            throw new CustomException(
                "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
                HttpStatus.TOO_MANY_REQUESTS
            );
        }
    }

    @Override
    public void checkIpLock(String ipAddress, String actionName) {
        String lockKey = String.format("lock:ip:%s:%s", actionName, ipAddress);

        Boolean isLocked = redisTemplate.hasKey(lockKey);
        if (Boolean.TRUE.equals(isLocked)) {
            // Lấy thời gian khóa còn lại trên Redis (tính theo giây)
            Long expireSeconds = redisTemplate.getExpire(lockKey, TimeUnit.SECONDS);
            long expireMinutes = (expireSeconds != null && expireSeconds > 0) ? (expireSeconds / 60) + 1 : 15;

            log.warn("IP {} is currently locked for action {}. Lock remaining: {} minutes", ipAddress, actionName, expireMinutes);
            throw new CustomException(
                String.format("Phát hiện hoạt động đăng nhập bất thường từ thiết bị của bạn. Vui lòng thử lại sau %d phút.", expireMinutes),
                HttpStatus.TOO_MANY_REQUESTS
            );
        }
    }

    @Override
    public void recordIpFailure(String ipAddress, String actionName, int maxFailures, int lockDurationInMinutes) {
        String failedKey = String.format("failed:%s:%s", actionName, ipAddress);
        String lockKey = String.format("lock:ip:%s:%s", actionName, ipAddress);

        // Tăng số lần gõ sai liên tiếp của IP
        Long failures = redisTemplate.opsForValue().increment(failedKey);

        // Thiết lập TTL cho Key đếm sai là 24 giờ
        redisTemplate.expire(failedKey, 24, TimeUnit.HOURS);

        log.warn("IP {} recorded failed attempt for action {}. Total consecutive failures: {}", ipAddress, actionName, failures);

        if (failures != null && failures >= maxFailures) {
            // Đạt ngưỡng sai liên tiếp -> Kích hoạt khóa IP
            redisTemplate.opsForValue().set(lockKey, "true", lockDurationInMinutes, TimeUnit.MINUTES);
            // Xóa sạch bộ đếm sai nháp sau khi đã khóa thành công
            redisTemplate.delete(failedKey);
            log.warn("IP {} has been blocked for {} minutes due to {} consecutive failures on action {}", 
                ipAddress, lockDurationInMinutes, failures, actionName);
        }
    }

    @Override
    public void clearFailureCount(String ipAddress, String actionName) {
        String failedKey = String.format("failed:%s:%s", actionName, ipAddress);
        String lockKey = String.format("lock:ip:%s:%s", actionName, ipAddress);

        // Xóa hoàn toàn các key nháp đếm sai và khóa IP (nếu có) khi thành công
        redisTemplate.delete(failedKey);
        redisTemplate.delete(lockKey);
        log.info("Cleared failure counts and locks for IP {} on action {}", ipAddress, actionName);
    }

    @Override
    public boolean isIpBlacklisted(String ipAddress) {
        String blacklistKey = String.format("lock:ip:blacklist:%s", ipAddress);
        return Boolean.TRUE.equals(redisTemplate.hasKey(blacklistKey));
    }

    @Override
    public void blacklistIp(String ipAddress) {
        String blacklistKey = String.format("lock:ip:blacklist:%s", ipAddress);
        // Lưu đen vĩnh viễn không thời hạn
        redisTemplate.opsForValue().set(blacklistKey, "true");
        log.warn("IP {} has been blacklisted permanently", ipAddress);
    }

    @Override
    public boolean isIpWhitelisted(String username, String ipAddress) {
        String whitelistKey = String.format("login:whitelist:%s:%s", username, ipAddress);
        return Boolean.TRUE.equals(redisTemplate.hasKey(whitelistKey));
    }

    @Override
    public void whitelistIp(String username, String ipAddress) {
        String whitelistKey = String.format("login:whitelist:%s:%s", username, ipAddress);
        // Whitelist trong 24 giờ
        redisTemplate.opsForValue().set(whitelistKey, "true", 24, TimeUnit.HOURS);
        log.info("IP {} is whitelisted for username {} for 24 hours", ipAddress, username);
    }

    @Override
    public boolean isGlobalLocked(String username) {
        String globalLockKey = String.format("login:global_lock:%s", username);
        return Boolean.TRUE.equals(redisTemplate.hasKey(globalLockKey));
    }

    @Override
    public void lockGlobally(String username) {
        String globalLockKey = String.format("login:global_lock:%s", username);
        // Khóa toàn cầu trong 24 giờ
        redisTemplate.opsForValue().set(globalLockKey, "true", 24, TimeUnit.HOURS);
        log.warn("Account {} is locked globally due to multiple distinct IP failures", username);
    }

    @Override
    public void unlockGlobally(String username) {
        String globalLockKey = String.format("login:global_lock:%s", username);
        String failedInfoKey = String.format("failed:info:%s", username);
        
        redisTemplate.delete(globalLockKey);
        redisTemplate.delete(failedInfoKey);
        log.info("Account {} is unlocked globally and cleared failed IP lists", username);
    }

    @Override
    public void recordFailedIpInfo(String username, String ipAddress, String deviceInfo, String location) {
        String failedInfoKey = String.format("failed:info:%s", username);
        String infoValue = String.format("%s (%s)", deviceInfo, location);
        
        redisTemplate.opsForHash().put(failedInfoKey, ipAddress, infoValue);
        // Hash tự hủy sau 24 giờ để tránh rác RAM
        redisTemplate.expire(failedInfoKey, 24, TimeUnit.HOURS);
        log.info("Recorded failed IP info for {} - IP {}: {}", username, ipAddress, infoValue);
    }

    @Override
    public Map<String, String> getFailedIpsInfo(String username) {
        String failedInfoKey = String.format("failed:info:%s", username);
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(failedInfoKey);
        
        Map<String, String> result = new HashMap<>();
        for (Map.Entry<Object, Object> entry : entries.entrySet()) {
            result.put(String.valueOf(entry.getKey()), String.valueOf(entry.getValue()));
        }
        return result;
    }

    @Override
    public String createUnlockToken(String username, String ipAddress) {
        String token = UUID.randomUUID().toString();
        String tokenKey = String.format("login:unlock_token:%s", token);
        String value = String.format("%s:%s", username, ipAddress);
        
        // Token tồn tại trong 1 giờ
        redisTemplate.opsForValue().set(tokenKey, value, 1, TimeUnit.HOURS);
        log.info("Created unlock token for {} at IP {}", username, ipAddress);
        return token;
    }

    @Override
    public String getUsernameAndIpByUnlockToken(String token) {
        String tokenKey = String.format("login:unlock_token:%s", token);
        String value = redisTemplate.opsForValue().get(tokenKey);
        if (value != null) {
            redisTemplate.delete(tokenKey);
        }
        return value;
    }

    @Override
    public String createBlockToken(String ipAddress) {
        String token = UUID.randomUUID().toString();
        String tokenKey = String.format("login:block_token:%s", token);
        
        // Token tồn tại trong 1 giờ
        redisTemplate.opsForValue().set(tokenKey, ipAddress, 1, TimeUnit.HOURS);
        log.info("Created block token for IP {}", ipAddress);
        return token;
    }

    @Override
    public String getIpByBlockToken(String token) {
        String tokenKey = String.format("login:block_token:%s", token);
        String ipAddress = redisTemplate.opsForValue().get(tokenKey);
        if (ipAddress != null) {
            redisTemplate.delete(tokenKey);
        }
        return ipAddress;
    }
}
