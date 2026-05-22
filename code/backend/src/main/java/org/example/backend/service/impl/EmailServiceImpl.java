package org.example.backend.service.impl;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.exception.BadRequestException;
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
    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(" Xác Thực Đăng Ký Tài Khoản - DevTrack AI");
            helper.setText(getHtmlContent(otp), true);

            mailSender.send(message);
            log.info("Successfully sent OTP HTML email to: {}", toEmail);
        } catch (org.springframework.mail.MailException e) {
            log.error("Mail Server Authentication/Connection Failed to: {}", toEmail, e);
            throw new BadRequestException("Lỗi cấu hình Email Server (SMTP). Vui lòng kiểm tra lại cấu hình email (Email/App Password) trong application.yaml.");
        } catch (Exception e) {
            log.error("Failed to send registration OTP email to: {}", toEmail, e);
            throw new BadRequestException("Failed to send OTP verification email");
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
                "            <p>&copy; 2026 DevTrack AI Team. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    @Override
    @Async
    public void sendSecurityAlertEmail(String toEmail, String username, int failedAttempts, long lockTimeMinutes,
            String deviceInfo, String location, String unlockLink) {
        log.info("Sending security alert email asynchronously to: {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🚨 Cảnh Báo Bảo Mật: Thiết Bị Của Bạn Đã Bị Khóa Tạm Thời - DevTrack AI");
            helper.setText(getSecurityAlertHtmlContent(username, failedAttempts, lockTimeMinutes, deviceInfo, location,
                    unlockLink), true);

            mailSender.send(message);
            log.info("Successfully sent security alert HTML email asynchronously to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send security alert email asynchronously to: {}", toEmail, e);
        }
    }

    @Override
    @Async
    public void sendEmergencyAttackAlertEmail(String toEmail, String username,
            java.util.Map<String, String> ipDetailsMap,
            java.util.Map<String, String> unlockTokensMap,
            java.util.Map<String, String> blockTokensMap) {
        log.info("Sending emergency attack alert email asynchronously to: {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🔥 CẢNH BÁO KHẨN CẤP: Phát Hiện Tấn Công Dò Quét Đa IP - DevTrack AI");
            helper.setText(getEmergencyAttackAlertHtmlContent(username, ipDetailsMap, unlockTokensMap, blockTokensMap),
                    true);

            mailSender.send(message);
            log.info("Successfully sent emergency attack HTML email asynchronously to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send emergency attack alert email asynchronously to: {}", toEmail, e);
        }
    }

    private String getSecurityAlertHtmlContent(String username, int failedAttempts, long lockTimeMinutes,
            String deviceInfo, String location, String unlockLink) {
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
                "        .btn-whitelist { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 24px; font-weight: 600; border-radius: 6px; margin: 20px 0; text-align: center; box-shadow: 0 2px 5px rgba(16, 185, 129, 0.2); }"
                +
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
                "            <h2>Tài khoản của bạn đã bị khóa tạm thời trên thiết bị này</h2>" +
                "            <p>Chào <strong>" + username + "</strong>,</p>" +
                "            <p>Hệ thống bảo mật đã phát hiện <strong>" + failedAttempts
                + " lần nhập sai mật khẩu liên tiếp</strong> từ thiết bị của bạn. Để đảm bảo an toàn, chúng tôi đã tạm thời khóa tính năng đăng nhập của tài khoản trên thiết bị này trong <strong>"
                + lockTimeMinutes + " phút</strong>.</p>" +
                "            " +
                "            <div class='alert-box'>" +
                "                <p class='alert-title'>Chi tiết thiết bị vi phạm:</p>" +
                "                <p class='alert-detail'>• <strong>Thiết bị:</strong> " + deviceInfo + "</p>" +
                "                <p class='alert-detail'>• <strong>Vị trí:</strong> " + location + "</p>" +
                "            </div>" +
                "            " +
                "            <p>Nếu hoạt động này <strong>do bạn thực hiện</strong> và bạn muốn mở khóa thiết bị này ngay lập tức để tiếp tục sử dụng, vui lòng click vào nút xác nhận dưới đây để đưa thiết bị vào danh sách Whitelist an toàn:</p>"
                +
                "            <div style='text-align: center;'>" +
                "                <a href='" + unlockLink
                + "' class='btn-whitelist'>Xác nhận đây là tôi & Mở khóa thiết bị</a>" +
                "            </div>" +
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

    private String getEmergencyAttackAlertHtmlContent(String username,
            java.util.Map<String, String> ipDetailsMap,
            java.util.Map<String, String> unlockTokensMap,
            java.util.Map<String, String> blockTokensMap) {
        StringBuilder devicesHtml = new StringBuilder();

        for (String ip : ipDetailsMap.keySet()) {
            String details = ipDetailsMap.get(ip);
            String unlockToken = unlockTokensMap.get(ip);
            String blockToken = blockTokensMap.get(ip);

            String unlockLink = "http://localhost:8080/api/v1/auth/unlock?token=" + unlockToken;
            String blockLink = "http://localhost:8080/api/v1/auth/block-ip?token=" + blockToken;

            devicesHtml.append("            <div class='device-card'>")
                    .append("                <p class='device-info'>• <strong>Thiết bị:</strong> ").append(details)
                    .append("</p>")
                    .append("                <p class='device-info'>• <strong>Địa chỉ IP:</strong> ").append(ip)
                    .append("</p>")
                    .append("                <div style='margin-top: 15px; text-align: center;'>")
                    .append("                    <a href='").append(unlockLink)
                    .append("' class='btn-action btn-green'>Đây là tôi (Whitelist)</a>")
                    .append("                    <a href='").append(blockLink)
                    .append("' class='btn-action btn-red'>Thiết bị lạ (Chặn vĩnh viễn)</a>")
                    .append("                </div>")
                    .append("            </div>");
        }

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='utf-8'>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1e1e24; color: #e2e8f0; margin: 0; padding: 0; }"
                +
                "        .email-container { max-width: 600px; margin: 40px auto; background-color: #2d2d34; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); overflow: hidden; border: 1px solid #3f3f46; }"
                +
                "        .email-header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; color: #ffffff; }"
                +
                "        .email-header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }" +
                "        .email-body { padding: 40px 35px; line-height: 1.6; color: #e2e8f0; }" +
                "        .email-body h2 { color: #f87171; font-size: 20px; margin-top: 0; font-weight: 600; text-align: center; }"
                +
                "        .device-card { background-color: #3f3f46; border-left: 4px solid #ef4444; border-radius: 6px; padding: 20px; margin: 25px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }"
                +
                "        .device-info { margin: 5px 0; color: #f4f4f5; font-size: 14px; }" +
                "        .btn-action { display: inline-block; text-decoration: none; padding: 8px 16px; font-weight: 600; border-radius: 4px; font-size: 12px; margin: 0 8px; text-align: center; transition: all 0.2s; }"
                +
                "        .btn-green { background: #10b981; color: #ffffff !important; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3); }"
                +
                "        .btn-red { background: #ef4444; color: #ffffff !important; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3); }"
                +
                "        .email-footer { background-color: #18181b; padding: 20px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #27272a; }"
                +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='email-container'>" +
                "        <div class='email-header'>" +
                "            <h1> Cảnh Báo An Ninh Khẩn Cấp DevTrack AI</h1>" +
                "        </div>" +
                "        <div class='email-body'>" +
                "            <h2>PHÁT HIỆN TẤN CÔNG DÒ QUÉT ĐA IP (BOTNET)</h2>" +
                "            <p>Chào <strong>" + username + "</strong>,</p>" +
                "            <p>Hệ thống phòng thủ của <strong>DevTrack AI</strong> phát hiện tài khoản của bạn đang bị càn quét đăng nhập từ <strong>nhiều địa chỉ IP khác nhau trên thế giới</strong> cùng một lúc. Để bảo vệ dữ liệu, chúng tôi đã kích hoạt chế độ **KHÓA CỨNG TOÀN CẦU** đối với tài khoản này.</p>"
                +
                "            " +
                "            <p>Dưới đây là danh sách các thiết bị/địa điểm đã phát sinh lỗi đăng nhập thất bại:</p>" +
                "            " +
                devicesHtml.toString() +
                "            " +
                "            <p><strong>Khuyên nghị bảo mật:</strong></p>" +
                "            <p>1. Nếu có thiết bị nào trong danh sách trên là của bạn, vui lòng click vào nút **[Đây là tôi (Whitelist)]** tương ứng để mở khóa và đưa thiết bị vào vùng an toàn.</p>"
                +
                "            <p>2. Đối với các thiết bị lạ, hãy click vào nút **[Thiết bị lạ (Chặn vĩnh viễn)]** để cấm hoàn toàn IP của hacker xâm nhập.</p>"
                +
                "            " +
                "            <p style='margin-top: 25px;'>Trân trọng,<br><strong>DevTrack AI Security Team</strong></p>"
                +
                "        </div>" +
                "        <div class='email-footer'>" +
                "            <p>Đây là email cảnh báo khẩn cấp tự động từ hệ thống DevTrack AI. Vui lòng không phản hồi lại email này.</p>"
                +
                "            <p>&copy; 2026 DevTrack AI Team. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    @Override
    @Async
    public void sendEmail(String toEmail, String subject, String body) {
        log.info("Sending basic email asynchronously to: {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("Successfully sent basic email asynchronously to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send basic email asynchronously to: {}", toEmail, e);
        }
    }
}