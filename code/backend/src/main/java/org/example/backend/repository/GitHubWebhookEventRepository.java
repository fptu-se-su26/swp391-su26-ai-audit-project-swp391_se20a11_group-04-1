package org.example.backend.repository;

import org.example.backend.entity.GitHubWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GitHubWebhookEventRepository extends JpaRepository<GitHubWebhookEvent, Long> {
    Optional<GitHubWebhookEvent> findByDeliveryId(String deliveryId);
}
