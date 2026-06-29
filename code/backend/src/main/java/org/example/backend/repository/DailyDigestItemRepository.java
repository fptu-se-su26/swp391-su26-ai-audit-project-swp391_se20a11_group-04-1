package org.example.backend.repository;

import org.example.backend.entity.DailyDigestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailyDigestItemRepository extends JpaRepository<DailyDigestItem, Long> {
}
