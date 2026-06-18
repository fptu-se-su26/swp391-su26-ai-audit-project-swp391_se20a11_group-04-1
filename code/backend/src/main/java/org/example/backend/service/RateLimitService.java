package org.example.backend.service;

public interface RateLimitService {
    
    /**
     * Kiểm tra giới hạn tần suất yêu cầu của một IP cho một hành động.
     * @param ipAddress Địa chỉ IP của client
     * @param actionName Tên hành động (ví dụ: "login", "register_otp")
     * @param maxRequests Số lượng request tối đa cho phép trong khoảng thời gian
     * @param durationInMinutes Khoảng thời gian giới hạn (phút)
     * @throws org.example.backend.exception.CustomException mã lỗi HTTP 429 nếu vượt ngưỡng
     */
    void checkRateLimit(String ipAddress, String actionName, int maxRequests, int durationInMinutes);

    /**
     * Kiểm tra xem địa chỉ IP có đang bị khóa cứng do nhập sai nhiều lần hay không.
     * @param ipAddress Địa chỉ IP của client
     * @param actionName Tên hành động
     * @throws org.example.backend.exception.CustomException mã lỗi HTTP 429 nếu IP đang bị khóa
     */
    void checkIpLock(String ipAddress, String actionName);

    /**
     * Ghi nhận 1 lần thất bại đăng nhập cho IP, nếu đạt ngưỡng sẽ tiến hành khóa cứng IP.
     * @param ipAddress Địa chỉ IP của client
     * @param actionName Tên hành động
     * @param maxFailures Số lần thất bại tối đa liên tiếp cho phép (ví dụ: 3 lần)
     * @param lockDurationInMinutes Thời gian khóa IP nếu vi phạm (ví dụ: 15 phút)
     */
    void recordIpFailure(String ipAddress, String actionName, int maxFailures, int lockDurationInMinutes);

    /**
     * Xóa sạch lịch sử thất bại của IP khi thực hiện hành động thành công.
     * @param ipAddress Địa chỉ IP của client
     * @param actionName Tên hành động
     */
    void clearFailureCount(String ipAddress, String actionName);

    /**
     * Kiểm tra xem IP có nằm trong danh sách đen vĩnh viễn không.
     */
    boolean isIpBlacklisted(String ipAddress);

    /**
     * Đưa IP vào danh sách đen vĩnh viễn.
     */
    void blacklistIp(String ipAddress);

    /**
     * Kiểm tra xem IP có nằm trong Whitelist an toàn của tài khoản không.
     */
    boolean isIpWhitelisted(String username, String ipAddress);

    /**
     * Đưa IP của người dùng vào danh sách Whitelist an toàn (TTL 24h).
     */
    void whitelistIp(String username, String ipAddress);

    /**
     * Kiểm tra xem tài khoản có đang bị khóa cứng trên toàn cầu không.
     */
    boolean isGlobalLocked(String username);

    /**
     * Kích hoạt khóa cứng tài khoản trên toàn thế giới (TTL 24h).
     */
    void lockGlobally(String username);

    /**
     * Mở khóa tài khoản toàn cầu.
     */
    void unlockGlobally(String username);

    /**
     * Lưu trữ chi tiết thiết bị và vị trí của IP lỗi vào Redis Hash.
     */
    void recordFailedIpInfo(String username, String ipAddress, String deviceInfo, String location);

    /**
     * Lấy danh sách các IP vi phạm cùng thông tin thiết bị/địa điểm.
     */
    java.util.Map<String, String> getFailedIpsInfo(String username);

    /**
     * Sinh secure token mở khóa liên kết với cặp [Tài khoản + IP] (TTL 1h).
     */
    String createUnlockToken(String username, String ipAddress);

    /**
     * Giải mã và xác thực token mở khóa, trả về chuỗi "username:ipAddress".
     */
    String getUsernameAndIpByUnlockToken(String token);

    /**
     * Sinh secure token để chặn IP vĩnh viễn (TTL 1h).
     */
    String createBlockToken(String ipAddress);

    /**
     * Giải mã và xác thực token chặn IP, trả về địa chỉ IP.
     */
    String getIpByBlockToken(String token);
}
