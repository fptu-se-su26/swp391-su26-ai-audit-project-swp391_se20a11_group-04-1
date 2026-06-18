package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "academic_contexts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicContext {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(nullable = false, length = 20)
    private String semester;

    @Column(name = "academic_year", nullable = false, length = 10)
    private String academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private UserAccount owner;

    @ManyToMany
    @JoinTable(
        name = "classroom_members",
        joinColumns = @JoinColumn(name = "classroom_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<UserAccount> enrolledStudents = new HashSet<>();

    @Column(name = "max_members", nullable = false)
    @Builder.Default
    private int maxMembers = 50;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;
}
