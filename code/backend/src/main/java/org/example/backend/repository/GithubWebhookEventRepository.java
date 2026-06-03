package org.example.backend.repository;

import org.example.backend.entity.GithubWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GithubWebhookEventRepository extends JpaRepository<GithubWebhookEvent, Long> {
    // GitHub delivery id is globally unique enough for idempotency in this module.
    Optional<GithubWebhookEvent> findByDeliveryId(String deliveryId);

    boolean existsByDeliveryId(String deliveryId);
}
