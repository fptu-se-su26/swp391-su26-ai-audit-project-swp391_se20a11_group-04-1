package org.example.backend;

import org.example.backend.entity.Notification;
import org.example.backend.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void contextLoads() {
        System.out.println("=== START JPA NOTIFICATION RETRIEVAL DIAGNOSTIC ===");
        try {
            List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(1L);
            System.out.println("Retrieved " + notifications.size() + " notifications successfully.");
            for (Notification n : notifications) {
                System.out.println("ID: " + n.getId() + ", Title: " + n.getTitle() + ", Project: " 
                    + (n.getProject() != null ? n.getProject().getId() : "null") + ", EntityType: " + n.getEntityType());
            }
        } catch (Exception e) {
            System.out.println("ERROR OCCURRED DURING RETRIEVAL:");
            e.printStackTrace();
        }
        System.out.println("=== END JPA NOTIFICATION RETRIEVAL DIAGNOSTIC ===");
    }

}
