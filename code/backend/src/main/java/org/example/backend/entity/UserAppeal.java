package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_appeals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAppeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "evidence_url", length = 500)
    private String evidenceUrl;

    @Column(name = "evidence_name", length = 255)
    private String evidenceName;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "admin_comment", columnDefinition = "TEXT")
    private String adminComment;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private UserAccount resolvedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
