package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "use_case_actors")
@Getter
@Setter
public class UseCaseActor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "use_case_id", nullable = false)
    private UseCase useCase;

    @Column(name = "actor_name", nullable = false, length = 100)
    private String actorName;
}
