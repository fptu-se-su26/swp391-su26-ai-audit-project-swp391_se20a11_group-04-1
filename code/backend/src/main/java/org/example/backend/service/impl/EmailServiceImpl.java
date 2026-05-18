package org.example.backend.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.exception.CustomException;
import org.example.backend.service.EmailService;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(" Xác Thực Đăng Ký Tài Khoản - DevTrack AI");
            helper.setText(getHtmlContent(otp), true);

            mailSender.send(message);
            log.info("Successfully sent OTP HTML email to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send registration OTP email to: {}", toEmail, e);
            throw new CustomException.BadRequestException("Failed to send OTP verification email");
        }
    }

    private String getHtmlContent(String otp) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='utf-8'>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; color: #333333; margin: 0; padding: 0; }"
                +
                "        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e1e8ed; }"
                +
                "        .email-header { background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 30px; text-align: center; color: #ffffff; }"
                +
                "        .email-header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }" +
                "        .email-body { padding: 40px 35px; line-height: 1.6; }" +
                "        .email-body h2 { color: #1e293b; font-size: 20px; margin-top: 0; font-weight: 600; }" +
                "        .otp-container { background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; border: 1px dashed #cbd5e1; }"
                +
                "        .otp-code { font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace; margin: 0; }"
                +
                "        .email-footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }"
                +
                "        .warning-text { font-size: 13px; color: #ef4444; font-weight: 500; margin-top: 25px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='email-container'>" +
                "        <div class='email-header'>" +
                "            <h1> DevTrack AI Authentication</h1>" +
                "        </div>" +
                "        <div class='email-body'>" +
                "            <h2>Xác Thực Đăng Ký Tài Khoản</h2>" +
                "            <p>Chào bạn,</p>" +
                "            <p>Cảm ơn bạn đã lựa chọn tham gia hệ thống quản lý dự án thông minh <strong>DevTrack AI</strong>. Để hoàn tất quy trình đăng ký tài khoản 2 bước, vui lòng nhập mã OTP xác thực dưới đây:</p>"
                +
                "            <div class='otp-container'>" +
                "                <p class='otp-code'>" + otp + "</p>" +
                "            </div>" +
                "            <p><strong>Lưu ý:</strong> Mã xác thực OTP này chỉ có hiệu lực sử dụng trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>"
                +
                "            <p class='warning-text'>⚠️ Nếu bạn không thực hiện yêu cầu đăng ký này, hãy bỏ qua email này.</p>"
                +
                "        </div>" +
                "        <div class='email-footer'>" +
                "            <p>Đây là email tự động từ hệ thống DevTrack AI. Vui lòng không phản hồi lại email này.</p>"
                +
                "            <p>&copy; 2026 DevTrack AI Team. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    @Override
    @Async
    public void sendSecurityAlertEmail(String toEmail, String username, int failedAttempts, long lockTimeMinutes) {
        log.info("Sending security alert email asynchronously to: {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(" Cảnh Báo Bảo Mật: Tài Khoản Tạm Thời Bị Khóa - DevTrack AI");
            helper.setText(getSecurityAlertHtmlContent(username, failedAttempts, lockTimeMinutes), true);

            mailSender.send(message);
            log.info("Successfully sent security alert HTML email asynchronously to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send security alert email asynchronously to: {}", toEmail, e);
            // Kịch bản Async: Không ném Exception ra luồng chính (luồng chính đã xử lý
            // fail-safe và throw LOCKED)
        }
    }

    private String getSecurityAlertHtmlContent(String username, int failedAttempts, long lockTimeMinutes) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='utf-8'>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; color: #333333; margin: 0; padding: 0; }"
                +
                "        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e1e8ed; }"
                +
                "        .email-header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 30px; text-align: center; color: #ffffff; }"
                +
                "        .email-header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }" +
                "        .email-body { padding: 40px 35px; line-height: 1.6; }" +
                "        .email-body h2 { color: #ef4444; font-size: 20px; margin-top: 0; font-weight: 600; }" +
                "        .alert-box { background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 20px; margin: 30px 0; }"
                +
                "        .alert-title { font-weight: 700; color: #991b1b; margin-top: 0; margin-bottom: 10px; }" +
                "        .alert-detail { margin: 5px 0; color: #7f1d1d; }" +
                "        .email-footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }"
                +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='email-container'>" +
                "        <div class='email-header'>" +
                "            <h1> Cảnh Báo Bảo Mật DevTrack AI</h1>" +
                "        </div>" +
                "        <div class='email-body'>" +
                "            <h2>Phát hiện hoạt động đăng nhập bất thường</h2>" +
                "            <p>Chào <strong>" + username + "</strong>,</p>" +
                "            <p>Hệ thống bảo mật của <strong>DevTrack AI</strong> đã phát hiện nhiều nỗ lực đăng nhập thất bại liên tiếp vào tài khoản của bạn. Để ngăn chặn các cuộc tấn công Brute-force và bảo vệ an toàn dữ liệu, chúng tôi đã tạm thời khóa tính năng đăng nhập của tài khoản này.</p>"
                +
                "            " +
                "            <div class='alert-box'>" +
                "                <p class='alert-title'>Chi tiết sự kiện:</p>" +
                "                <p class='alert-detail'>• <strong>Tài khoản:</strong> " + username + "</p>" +
                "                <p class='alert-detail'>• <strong>Số lần nhập sai liên tiếp:</strong> "
                + failedAttempts + " lần</p>" +
                "                <p class='alert-detail'>• <strong>Thời gian khóa tạm thời:</strong> " + lockTimeMinutes
                + " phút</p>" +
                "            </div>" +
                "            " +
                "            <p><strong>Khuyến nghị bảo mật:</strong></p>" +
                "            <p>Nếu hoạt động này <strong>không phải do bạn</strong> thực hiện, rất có thể ai đó đang cố gắng truy cập trái phép tài khoản của bạn. Vui lòng thực hiện đổi mật khẩu ngay lập tức sau khi tài khoản được mở khóa để đảm bảo an toàn.</p>"
                +
                "            " +
                "            <p style='margin-top: 25px;'>Trân trọng,<br><strong>DevTrack AI Security Team</strong></p>"
                +
                "        </div>" +
                "        <div class='email-footer'>" +
                "            <p>Đây là email tự động cảnh báo bảo mật từ hệ thống DevTrack AI. Vui lòng không phản hồi lại email này.</p>"
                +
                "            <p>&copy; 2026 DevTrack AI Team. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }
}