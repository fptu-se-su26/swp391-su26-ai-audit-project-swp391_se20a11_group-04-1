package org.example.backend.entity.config;

import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;
import lombok.*;
import org.example.backend.entity.TestCase;

@Entity
@Table(name = "test_case_ui_configs")
@Getter
@Setter
@NoArgsConstructor
public class UiTestConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", referencedColumnName = "id", nullable = false, unique = true)
    private TestCase testCase;

    @Column(name = "base_url")
    private String baseUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private JsonNode steps = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.arrayNode();

    @Column(name = "cached_playwright_script", columnDefinition = "text")
    private String cachedPlaywrightScript;

    @Column(name = "script_source", length = 20)
    private String scriptSource;

    @Column(name = "script_generated_at", columnDefinition = "text")
    private String scriptGeneratedAt;
}
