package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.CodePatchAnalysisResult;
import org.example.backend.dto.ReqDiffAlignmentResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReqDiffAlignmentServiceImpl")
class ReqDiffAlignmentServiceImplTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ReqDiffAlignmentServiceImpl alignmentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(alignmentService, "apiKey", "mock-api-key");
        ReflectionTestUtils.setField(alignmentService, "model", "gemini-3.6-flash");
        ReflectionTestUtils.setField(alignmentService, "timeoutSeconds", 30);
    }

    @Test
    void testAlign_EmptyCriteria() {
        ReqDiffAlignmentResult result = alignmentService.align(new CodePatchAnalysisResult(), null);
        assertThat(result.getAlignmentMatrix()).isEmpty();
        assertThat(result.getCoverageRatio()).isEqualTo(0.0);

        result = alignmentService.align(new CodePatchAnalysisResult(), Collections.emptyList());
        assertThat(result.getAlignmentMatrix()).isEmpty();
        assertThat(result.getCoverageRatio()).isEqualTo(0.0);
    }

    @Test
    void testAlign_NoApiKey() {
        ReflectionTestUtils.setField(alignmentService, "apiKey", null);
        ReqDiffAlignmentResult result = alignmentService.align(new CodePatchAnalysisResult(), List.of("AC-1"));
        assertThat(result.getAlignmentMatrix()).isEmpty();
        assertThat(result.getCoverageRatio()).isEqualTo(0.0);
    }

    @Test
    void testAlign_Success() throws Exception {
        CodePatchAnalysisResult patchAnalysis = new CodePatchAnalysisResult();
        List<String> criteria = List.of("User can reset password");

        String mockResponseJson = "{\"candidates\": [{\"content\": {\"parts\": [{\"text\": \"{\\\"alignmentMatrix\\\": [{\\\"acText\\\": \\\"User can reset password\\\", \\\"status\\\": \\\"FULLY_COVERED\\\", \\\"evidenceDetail\\\": \\\"AuthService.java\\\"}], \\\"coverageRatio\\\": 1.0, \\\"coveredCount\\\": 1, \\\"totalCount\\\": 1, \\\"finalRiskLevel\\\": \\\"LOW\\\"}\"}]}}]}";

        ResponseEntity<String> responseEntity = new ResponseEntity<>(mockResponseJson, HttpStatus.OK);
        when(restTemplate.exchange(
                eq("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(String.class)
        )).thenReturn(responseEntity);

        JsonNode responseNode = mock(JsonNode.class);
        JsonNode textNode = mock(JsonNode.class);
        when(objectMapper.readTree(mockResponseJson)).thenReturn(responseNode);
        when(responseNode.at("/candidates/0/content/parts/0/text")).thenReturn(textNode);
        when(textNode.isMissingNode()).thenReturn(false);
        when(textNode.asText()).thenReturn("{\"alignmentMatrix\": [{\"acText\": \"User can reset password\", \"status\": \"FULLY_COVERED\", \"evidenceDetail\": \"AuthService.java\"}], \"coverageRatio\": 1.0, \"coveredCount\": 1, \"totalCount\": 1, \"finalRiskLevel\": \"LOW\"}");

        ReqDiffAlignmentResult expectedResult = ReqDiffAlignmentResult.builder()
                .alignmentMatrix(List.of(ReqDiffAlignmentResult.AlignmentItem.builder()
                        .acText("User can reset password")
                        .status("FULLY_COVERED")
                        .evidenceDetail("AuthService.java")
                        .build()))
                .coverageRatio(1.0)
                .coveredCount(1)
                .totalCount(1)
                .finalRiskLevel("LOW")
                .build();

        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(objectMapper.readValue(any(String.class), eq(ReqDiffAlignmentResult.class)))
                .thenReturn(expectedResult);

        ReqDiffAlignmentResult result = alignmentService.align(patchAnalysis, criteria);

        assertThat(result).isNotNull();
        assertThat(result.getFinalRiskLevel()).isEqualTo("LOW");
        assertThat(result.getCoverageRatio()).isEqualTo(1.0);
        assertThat(result.getAlignmentMatrix()).hasSize(1);
        assertThat(result.getAlignmentMatrix().get(0).getAcText()).isEqualTo("User can reset password");
        assertThat(result.getAlignmentMatrix().get(0).getStatus()).isEqualTo("FULLY_COVERED");
    }
}
