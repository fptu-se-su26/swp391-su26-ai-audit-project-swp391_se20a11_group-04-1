package org.example.backend.entity.config;

import jakarta.persistence.*;
import lombok.*;
import org.example.backend.entity.TestCase;

@Entity
@Table(name = "test_case_unit_configs")
@Getter
@Setter
@NoArgsConstructor
public class UnitTestConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", referencedColumnName = "id", nullable = false, unique = true)
    private TestCase testCase;
}
