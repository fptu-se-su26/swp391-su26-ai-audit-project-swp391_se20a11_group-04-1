package org.example.backend.entity.config;

import com.fasterxml.jackson.databind.JsonNode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;
import lombok.*;
import org.example.backend.entity.TestCase;

@Entity
@Table(name = "test_case_api_configs")
@Getter
@Setter
@NoArgsConstructor
public class ApiTestConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", referencedColumnName = "id", nullable = false, unique = true)
    private TestCase testCase;

    @Column(name = "api_method", length = 10, nullable = false)
    private String apiMethod = "GET";

    @Column(name = "api_url", columnDefinition = "text", nullable = false)
    private String apiUrl = "";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "api_headers", columnDefinition = "jsonb", nullable = false)
    private JsonNode apiHeaders = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "api_query_params", columnDefinition = "jsonb", nullable = false)
    private JsonNode apiQueryParams = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "api_body", columnDefinition = "jsonb")
    private JsonNode apiBody;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "api_assertions", columnDefinition = "jsonb", nullable = false)
    private JsonNode apiAssertions = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.arrayNode();
}
