package org.example.backend.repository;

import org.example.backend.entity.CodeInsightAiReview;
import org.example.backend.entity.CodeInsightReview;
import org.example.backend.entity.Task;
import org.example.backend.entity.UserAccount;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
public class CodeInsightThreePillarRepositoryTest {

    @Autowired
    private CodeInsightReviewRepository reviewRepository;

    @Autowired
    private CodeInsightAiReviewRepository aiReviewRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Test
    public void testSaveAndRetrieveThreePillarFields() {
        // Fetch a task and a reviewer to link with the review snapshot
        List<Task> tasks = taskRepository.findAll();
        assertThat(tasks).isNotEmpty();
        Task task = tasks.get(0);

        List<UserAccount> users = userAccountRepository.findAll();
        assertThat(users).isNotEmpty();
        UserAccount reviewer = users.get(0);

        // 1. Test CodeInsightAiReview new fields
        CodeInsightAiReview aiReview = CodeInsightAiReview.builder()
                .task(task)
                .provider("GEMINI")
                .recommendation("NEEDS_REVIEW")
                .confidence(85)
                .alignmentResultJson("{\"ac_1\": \"COVERED\", \"ac_2\": \"NOT_FOUND\"}")
                .alignmentCoverageRatio(0.5)
                .alignmentCoveredCount(1)
                .alignmentTotalCount(2)
                .codeRiskLevel("MEDIUM")
                .build();

        CodeInsightAiReview savedAiReview = aiReviewRepository.save(aiReview);
        assertThat(savedAiReview.getId()).isNotNull();

        CodeInsightAiReview retrievedAiReview = aiReviewRepository.findById(savedAiReview.getId()).orElse(null);
        assertThat(retrievedAiReview).isNotNull();
        assertThat(retrievedAiReview.getAlignmentResultJson()).isEqualTo("{\"ac_1\": \"COVERED\", \"ac_2\": \"NOT_FOUND\"}");
        assertThat(retrievedAiReview.getAlignmentCoverageRatio()).isEqualTo(0.5);
        assertThat(retrievedAiReview.getAlignmentCoveredCount()).isEqualTo(1);
        assertThat(retrievedAiReview.getAlignmentTotalCount()).isEqualTo(2);
        assertThat(retrievedAiReview.getCodeRiskLevel()).isEqualTo("MEDIUM");

        // 2. Test CodeInsightReview new fields
        CodeInsightReview review = CodeInsightReview.builder()
                .task(task)
                .reviewer(reviewer)
                .ruleScore(80)
                .aiAdjustment(-5)
                .finalScore(75)
                .evidenceHash("dummyhash123")
                .gateResult("CAN_APPROVE_WITH_WARNING")
                .evidenceConfidence("STRONG")
                .codeRiskLevel("LOW")
                .aiReview(retrievedAiReview)
                .build();

        CodeInsightReview savedReview = reviewRepository.save(review);
        assertThat(savedReview.getId()).isNotNull();

        CodeInsightReview retrievedReview = reviewRepository.findById(savedReview.getId()).orElse(null);
        assertThat(retrievedReview).isNotNull();
        assertThat(retrievedReview.getGateResult()).isEqualTo("CAN_APPROVE_WITH_WARNING");
        assertThat(retrievedReview.getEvidenceConfidence()).isEqualTo("STRONG");
        assertThat(retrievedReview.getCodeRiskLevel()).isEqualTo("LOW");
        assertThat(retrievedReview.getAiReview().getId()).isEqualTo(retrievedAiReview.getId());
    }
}
