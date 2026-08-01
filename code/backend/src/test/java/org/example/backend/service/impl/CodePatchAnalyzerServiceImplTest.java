package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.CodePatchAnalysisResult;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CodePatchAnalyzerServiceImpl")
class CodePatchAnalyzerServiceImplTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private CodePatchAnalyzerServiceImpl analyzerService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(analyzerService, "apiKey", "mock-api-key");
        ReflectionTestUtils.setField(analyzerService, "model", "gemini-3.6-flash");
        ReflectionTestUtils.setField(analyzerService, "timeoutSeconds", 30);
    }

    @Test
    void testAnalyzePatch_EmptyDiff() {
        CodePatchAnalysisResult result = analyzerService.analyzePatch(null);
        assertThat(result.getPhysicalChanges()).isEmpty();
        assertThat(result.getMethodSignatures()).isEmpty();

        result = analyzerService.analyzePatch("   ");
        assertThat(result.getPhysicalChanges()).isEmpty();
        assertThat(result.getMethodSignatures()).isEmpty();
    }

    @Test
    void testAnalyzePatch_NoApiKey() {
        ReflectionTestUtils.setField(analyzerService, "apiKey", null);
        assertThatThrownBy(() -> analyzerService.analyzePatch("some-diff"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AI provider API key is not configured");
    }

    @Test
    void testAnalyzePatch_Success() throws Exception {
        String rawDiff = "diff --git a/src/main/java/org/example/backend/service/impl/AuthServiceImpl.java ...";
        String mockResponseJson = "{\"candidates\": [{\"content\": {\"parts\": [{\"text\": \"{\\\"physicalChanges\\\": [{\\\"filePath\\\": \\\"AuthServiceImpl.java\\\", \\\"action\\\": \\\"MODIFIED\\\", \\\"fileType\\\": \\\"java\\\"}]}\"}]}}]}";

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
        when(textNode.asText()).thenReturn("{\"physicalChanges\": [{\"filePath\": \"AuthServiceImpl.java\", \"action\": \"MODIFIED\", \"fileType\": \"java\"}]}");

        CodePatchAnalysisResult expectedResult = CodePatchAnalysisResult.builder()
                .physicalChanges(List.of(CodePatchAnalysisResult.FileChange.builder()
                        .filePath("AuthServiceImpl.java")
                        .action("MODIFIED")
                        .fileType("java")
                        .build()))
                .build();

        when(objectMapper.readValue(any(String.class), eq(CodePatchAnalysisResult.class)))
                .thenReturn(expectedResult);

        CodePatchAnalysisResult result = analyzerService.analyzePatch(rawDiff);

        assertThat(result).isNotNull();
        assertThat(result.getPhysicalChanges()).hasSize(1);
        assertThat(result.getPhysicalChanges().get(0).getFilePath()).isEqualTo("AuthServiceImpl.java");
        assertThat(result.getPhysicalChanges().get(0).getAction()).isEqualTo("MODIFIED");
    }
}
