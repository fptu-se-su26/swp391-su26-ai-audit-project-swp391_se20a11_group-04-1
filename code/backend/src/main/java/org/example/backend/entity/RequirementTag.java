package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "requirement_tags")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequirementTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Requirement requirement;

    @Column(name = "tag", nullable = false, length = 50)
    private String tag;
}
