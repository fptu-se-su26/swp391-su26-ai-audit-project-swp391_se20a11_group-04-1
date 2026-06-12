package org.example.backend.repository;

import org.example.backend.entity.CodeInsightReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CodeInsightReviewRepository extends JpaRepository<CodeInsightReview, Long> {
}
