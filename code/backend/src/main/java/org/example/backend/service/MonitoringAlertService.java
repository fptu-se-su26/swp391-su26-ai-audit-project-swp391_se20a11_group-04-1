package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringAlertService {

    private final EmailService emailService;

    @Value("${app.monitoring.admin-email}")
    private String adminEmail;

    @Async("monitoringExecutor")
    public void sendHealthAlert(String component, String status, String message) {
        try {
            String subject = "[ALERT] System component DOWN: " + component;
            String body = String.format(
                    "Component: %s\nStatus: %s\nMessage: %s\nTime: %s",
                    component,
                    status,
                    message,
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
            );
            emailService.sendEmail(adminEmail, subject, body);
            log.info("Sent health alert for component {}", component);
        } catch (Exception e) {
            log.error("Failed to send health alert email", e);
        }
    }

    @Async("monitoringExecutor")
    public void sendJobFailureAlert(String jobName, int consecutiveFailures, String errorMessage) {
        try {
            String subject = "[ALERT] Scheduled Job failing: " + jobName;
            String body = String.format(
                    "Job: %s\nConsecutive failures: %d\nLast error: %s\nTime: %s",
                    jobName,
                    consecutiveFailures,
                    errorMessage,
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
            );
            emailService.sendEmail(adminEmail, subject, body);
            log.info("Sent job failure alert for job {}", jobName);
        } catch (Exception e) {
            log.error("Failed to send job failure alert email", e);
        }
    }
}
