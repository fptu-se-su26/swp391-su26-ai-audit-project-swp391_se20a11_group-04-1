package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "daily_digests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyDigest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(name = "digest_date", nullable = false)
    private LocalDate digestDate;

    @Column(name = "digest_type", nullable = false, length = 50)
    @Builder.Default
    private String digestType = "DAILY_MEMBER_DIGEST";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "item_count", nullable = false)
    @Builder.Default
    private int itemCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @OneToMany(mappedBy = "digest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DailyDigestItem> items = new ArrayList<>();

    public void addItem(DailyDigestItem item) {
        items.add(item);
        item.setDigest(this);
        itemCount = items.size();
    }
}
