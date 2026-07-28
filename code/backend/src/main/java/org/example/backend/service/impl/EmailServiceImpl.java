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

    @org.springframework.beans.factory.annotation.Value("${app.api-base-url:http://localhost:8080}")
    private String appBaseUrl;

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

    @Override
    @Async
    public void sendAuditDigestEmail(String toEmail, String leaderName, String projectName, java.util.List<org.example.backend.entity.AuditLog> recentLogs) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("📊 Báo cáo Hoạt động Dự án - " + projectName);
            helper.setText(getAuditDigestHtmlContent(leaderName, projectName, recentLogs), true);

            mailSender.send(message);
            log.info("Successfully sent Audit Digest HTML email to: {} for project {}", toEmail, projectName);
        } catch (Exception e) {
            log.error("Failed to send Audit Digest email to: {}", toEmail, e);
        }
    }

    @Override
    @Async
    public void sendForgotPasswordOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🔑 Yêu Cầu Đặt Lại Mật Khẩu - DevTrack AI");
            helper.setText(getForgotPasswordHtmlContent(otp), true);

            mailSender.send(message);
            log.info("Successfully sent forgot password OTP HTML email to: {}", toEmail);
        } catch (org.springframework.mail.MailException e) {
            log.error("Mail Server Authentication/Connection Failed to: {}", toEmail, e);
            throw new BadRequestException("Lỗi cấu hình Email Server (SMTP). Vui lòng kiểm tra lại cấu hình email (Email/App Password) trong application.yaml.");
        } catch (Exception e) {
            log.error("Failed to send forgot password OTP email to: {}", toEmail, e);
            throw new BadRequestException("Failed to send OTP verification email");
        }
    }

    private String getForgotPasswordHtmlContent(String otp) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='utf-8'>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; color: #333333; margin: 0; padding: 0; }" +
                "        .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e1e8ed; }" +
                "        .email-header { background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 30px; text-align: center; color: #ffffff; }" +
                "        .email-header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }" +
                "        .email-body { padding: 40px 35px; line-height: 1.6; }" +
                "        .email-body h2 { color: #1e293b; font-size: 20px; margin-top: 0; font-weight: 600; }" +
                "        .otp-container { background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; border: 1px dashed #cbd5e1; }" +
                "        .otp-code { font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace; margin: 0; }" +
                "        .email-footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }" +
                "        .warning-text { font-size: 13px; color: #ef4444; font-weight: 500; margin-top: 25px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='email-container'>" +
                "        <div class='email-header'>" +
                "            <h1> DevTrack AI Authentication</h1>" +
                "        </div>" +
                "        <div class='email-body'>" +
                "            <h2>Yêu Cầu Đặt Lại Mật Khẩu</h2>" +
                "            <p>Chào bạn,</p>" +
                "            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>DevTrack AI</strong> của bạn. Vui lòng nhập mã OTP xác thực dưới đây để tiến hành đặt mật khẩu mới:</p>" +
                "            <div class='otp-container'>" +
                "                <p class='otp-code'>" + otp + "</p>" +
                "            </div>" +
                "            <p><strong>Lưu ý:</strong> Mã xác thực OTP này chỉ có hiệu lực sử dụng trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn.</p>" +
                "            <p class='warning-text'>⚠️ Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với quản trị viên nếu bạn nghi ngờ có hành vi xâm nhập.</p>" +
                "            <p>&copy; 2026 DevTrack AI Team. All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
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

            String unlockLink = appBaseUrl + "/api/v1/auth/unlock?token=" + unlockToken;
            String blockLink = appBaseUrl + "/api/v1/auth/block-ip?token=" + blockToken;

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
    public void sendEmail(String toEmail, String subject, String body) {
        log.info("Sending basic email to: {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("Successfully sent basic email to: {}", toEmail);
        } catch (org.springframework.mail.MailException e) {
            log.error("Mail server authentication/connection failed to: {}", toEmail, e);
            throw new BadRequestException("Email server error. Please check SMTP configuration.");
        } catch (Exception e) {
            log.error("Failed to send basic email to: {}", toEmail, e);
            throw new BadRequestException("Failed to send email");
        }
    }
    private String extractEntityName(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(json);
            // Try direct fields first (title, name for UC/Requirement)
            for (String key : new String[]{"title", "name", "taskName", "requirementName", "ucName", "summary"}) {
                if (node.has(key) && !node.get(key).isNull()) {
                    String val = node.get(key).asText("").trim();
                    if (!val.isEmpty() && !val.equals("null")) return val;
                }
            }
        } catch (Exception ignored) {}
        // Regex fallback for complex serialized entities
        if (json.contains("\"title\":")) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"title\":\\s*\"([^\"]+)\"")
                    .matcher(json);
            if (m.find()) return m.group(1);
        }
        if (json.contains("\"name\":")) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"name\":\\s*\"([^\"]+)\"")
                    .matcher(json);
            if (m.find()) { String v = m.group(1); if (!v.isBlank()) return v; }
        }
        return null;
    }

    private String buildDetailUrl(String entityType, Long entityId, Long projectId) {
        if (entityId == null || projectId == null) return null;
        String appFe = appBaseUrl.replace(":8080", ":5173"); // FE dev port, production sẽ cùng domain
        // Nếu appBaseUrl là production domain thì FE cùng domain → chỉ thay path
        String base = appBaseUrl.contains("localhost") ? "http://localhost:5173" : appBaseUrl;
        switch (entityType.toUpperCase()) {
            case "TASK":        return base + "/projects/" + projectId + "/tasks/"        + entityId;
            case "REQUIREMENT": return base + "/projects/" + projectId + "/requirements/" + entityId;
            case "USE_CASE":    return base + "/projects/" + projectId + "/use-cases/"    + entityId;
            default: return null;
        }
    }

    private String getAuditDigestHtmlContent(String leaderName, String projectName, java.util.List<org.example.backend.entity.AuditLog> logs) {
        java.time.format.DateTimeFormatter fmt = java.time.format.DateTimeFormatter.ofPattern("HH:mm · dd/MM/yyyy");

        // Filter only TASK / REQUIREMENT / USE_CASE and exclude generic UPDATE logs from AuditAspect (which lack a proper JSON oldValue)
        java.util.List<org.example.backend.entity.AuditLog> filtered = logs.stream()
                .filter(l -> l.getEntityType() != null &&
                        (l.getEntityType().equalsIgnoreCase("TASK") ||
                         l.getEntityType().equalsIgnoreCase("REQUIREMENT") ||
                         l.getEntityType().equalsIgnoreCase("USE_CASE")))
                .filter(l -> {
                    if (l.getAction() != null && l.getAction().startsWith("REVERT_")) {
                        return false;
                    }
                    if (l.getAction() != null && l.getAction().startsWith("UPDATE_")) {
                        return l.getOldValue() != null && l.getOldValue().trim().startsWith("{");
                    }
                    return false; // Exclude CREATE, DELETE, GET, and any other actions
                })
                .collect(java.util.stream.Collectors.toList());

        if (filtered.isEmpty()) {
            return "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:32px;color:#475569;'>" +
                   "<p>No Task / Requirement / Use Case changes recorded today.</p>" +
                   "</body></html>";
        }

        StringBuilder rows = new StringBuilder();
        int idx = 1;
        for (org.example.backend.entity.AuditLog log : filtered) {
            String time   = log.getCreatedAt() != null ? log.getCreatedAt().format(fmt) : "—";
            String actor  = log.getUsername()  != null ? log.getUsername() : "System";
            String action = log.getAction()    != null ? log.getAction()   : "—";
            String type   = log.getEntityType();

            // Entity name: try newValue first, then oldValue
            String entityName = extractEntityName(log.getNewValue());
            if (entityName == null) entityName = extractEntityName(log.getOldValue());
            if (entityName == null || entityName.isBlank()) {
                entityName = "<em style='color:#94A3B8;font-weight:400;'>Untitled " + type.replace("_", " ") + "</em>";
            }

            // Type badge
            String typeBadge, typeBg, typeLabel;
            switch (type.toUpperCase()) {
                case "TASK":        typeBadge = "#6D28D9"; typeBg = "#EDE9FE"; typeLabel = "Task"; break;
                case "REQUIREMENT": typeBadge = "#0369A1"; typeBg = "#E0F2FE"; typeLabel = "Requirement"; break;
                case "USE_CASE":    typeBadge = "#0F766E"; typeBg = "#CCFBF1"; typeLabel = "Use Case"; break;
                default:            typeBadge = "#6B7280"; typeBg = "#F3F4F6"; typeLabel = type;
            }

            // Action badge
            String actionColor, actionBg;
            String au = action.toUpperCase();
            if (au.contains("DELETE") || au.contains("REMOVE")) {
                actionColor = "#B91C1C"; actionBg = "#FEF2F2";
            } else if (au.contains("CREATE") || au.contains("ADD")) {
                actionColor = "#047857"; actionBg = "#ECFDF5";
            } else if (au.contains("UPDATE") || au.contains("EDIT") || au.contains("REVERT")) {
                actionColor = "#1D4ED8"; actionBg = "#EFF6FF";
            } else {
                actionColor = "#6B7280"; actionBg = "#F9FAFB";
            }

            // View detail link (Always show)
            String detailUrl = buildDetailUrl(type, log.getEntityId(), log.getProjectId());
            String linkHtml = (detailUrl != null)
                ? "<a href='" + detailUrl + "' style='display:inline-block;margin-top:6px;font-size:11px;font-weight:600;" +
                  "color:#FFFFFF;background:#1E707D;text-decoration:none;border-radius:5px;padding:4px 14px;" +
                  "letter-spacing:0.3px;'>View Detail &rarr;</a>"
                : "";

            // Status badge
            String statusBadgeHtml;
            if ("REVERTED".equalsIgnoreCase(log.getStatus()) || au.contains("REVERT")) {
                statusBadgeHtml = "<span style='font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;background:#FEF2F2;color:#B91C1C;'>Reverted</span>";
            } else {
                statusBadgeHtml = "<span style='font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;background:#F0FDF4;color:#15803D;'>Done</span>";
            }

            String rowBg = (idx % 2 == 0) ? "#F8FAFC" : "#FFFFFF";
            rows.append("<tr style='background:" + rowBg + ";'>")
                .append("<td style='padding:14px 12px;font-size:12px;color:#64748B;white-space:nowrap;vertical-align:top;border-bottom:1px solid #F1F5F9;'>") 
                .append(time).append("</td>")
                .append("<td style='padding:14px 12px;font-size:13px;font-weight:600;color:#1E293B;white-space:nowrap;vertical-align:top;border-bottom:1px solid #F1F5F9;'>")
                .append(actor).append("</td>")
                .append("<td style='padding:14px 12px;vertical-align:top;border-bottom:1px solid #F1F5F9;width:100%;'>")
                .append("<div style='margin-bottom:6px;'>")
                .append("<span style='font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;background:" + typeBg + ";color:" + typeBadge + ";'>" + typeLabel + "</span>")
                .append("</div>")
                .append("<p style='margin:0 0 0 0;font-size:14px;font-weight:700;color:#0F172A;line-height:1.4;'>" + entityName + "</p>")
                .append("</td>")
                .append("<td style='padding:14px 12px;vertical-align:top;white-space:nowrap;border-bottom:1px solid #F1F5F9;'>")
                .append(statusBadgeHtml)
                .append("</td>")
                .append("<td style='padding:14px 12px;vertical-align:top;white-space:nowrap;border-bottom:1px solid #F1F5F9;text-align:right;'>")
                .append(linkHtml)
                .append("</td>")
                .append("</tr>");
            idx++;
        }

        String today = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM dd, yyyy", java.util.Locale.ENGLISH));

        return "<!DOCTYPE html>" +
            "<html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'>" +
            "<title>Project Activity Report - DevTrack AI</title></head>" +
            "<body style='margin:0;padding:0;background:#EEF2F7;font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#EEF2F7;padding:36px 24px;'>" +
            "<tr><td align='center'>" +

            // Outer container — 700px wide
            "<table width='700' cellpadding='0' cellspacing='0' style='max-width:700px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.09);'>" +

            // HEADER
            "<tr><td style='background:linear-gradient(135deg,#1A6472 0%,#257D8A 50%,#1A8A7A 100%);padding:28px 36px;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0'><tr>" +
            "<td><p style='margin:0;font-size:10px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.6);text-transform:uppercase;'>DevTrack AI</p>" +
            "<h1 style='margin:5px 0 0;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;'>Project Activity Report</h1></td>" +
            "<td align='right' valign='middle'>" +
            "<div style='background:rgba(255,255,255,0.13);border-radius:8px;padding:8px 16px;display:inline-block;text-align:center;'>" +
            "<p style='margin:0;font-size:11px;color:rgba(255,255,255,0.7);'>Date</p>" +
            "<p style='margin:2px 0 0;font-size:13px;font-weight:600;color:#FFFFFF;'>" + today + "</p>" +
            "</div></td></tr></table></td></tr>" +

            // GREETING
            "<tr><td style='padding:28px 36px 16px;border-bottom:1px solid #F1F5F9;'>" +
            "<p style='margin:0 0 6px;font-size:16px;font-weight:700;color:#0F172A;'>Hi, <span style='color:#1A6472;'>" + leaderName + "</span> 👋</p>" +
            "<p style='margin:0;font-size:13px;color:#64748B;line-height:1.65;'>Here is a summary of all changes to <strong>Tasks</strong>, <strong>Requirements</strong>, and <strong>Use Cases</strong> " +
            "in project <strong style='color:#0F172A;'>" + projectName + "</strong> recorded today.</p>" +
            "</td></tr>" +

            // TABLE
            "<tr><td style='padding:20px 36px;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;border-collapse:collapse;'>" +
            "<thead><tr style='background:#F8FAFC;'>" +
            "<th style='padding:11px 12px;text-align:left;font-size:11px;font-weight:700;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;white-space:nowrap;'>Time</th>" +
            "<th style='padding:11px 12px;text-align:left;font-size:11px;font-weight:700;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;white-space:nowrap;'>Modified By</th>" +
            "<th style='padding:11px 12px;text-align:left;font-size:11px;font-weight:700;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;width:100%;'>Change Detail</th>" +
            "<th style='padding:11px 12px;text-align:left;font-size:11px;font-weight:700;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;white-space:nowrap;'>Status</th>" +
            "<th style='padding:11px 12px;text-align:right;font-size:11px;font-weight:700;color:#94A3B8;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;white-space:nowrap;'>Action</th>" +
            "</tr></thead>" +
            "<tbody>" + rows + "</tbody></table>" +
            "</td></tr>" +

            // TIP
            "<tr><td style='padding:0 36px 24px;'>" +
            "<div style='background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 18px;'>" +
            "<p style='margin:0;font-size:12px;color:#15803D;line-height:1.5;'>💡 <strong>Tip:</strong> Click <strong>\"View Detail &rarr;\"</strong> to log in and navigate directly to the specific item on the system.</p>" +
            "</div></td></tr>" +

            // SIGN-OFF
            "<tr><td style='padding:4px 36px 28px;'>" +
            "<p style='margin:0;font-size:13px;color:#64748B;'>Best regards,</p>" +
            "<p style='margin:4px 0 0;font-size:13px;font-weight:700;color:#1A6472;'>DevTrack AI Team</p>" +
            "</td></tr>" +

            // FOOTER
            "<tr><td style='background:#F8FAFC;padding:14px 36px;border-top:1px solid #E2E8F0;text-align:center;'>" +
            "<p style='margin:0;font-size:11px;color:#94A3B8;'>This report is auto-generated daily at 8:00 PM &middot; Please do not reply to this email</p>" +
            "<p style='margin:4px 0 0;font-size:11px;color:#CBD5E1;'>&copy; 2026 DevTrack AI Team &middot; All rights reserved</p>" +
            "</td></tr>" +

            "</table></td></tr></table></body></html>";
    }
}
