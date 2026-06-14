package org.example.backend.service;

import org.example.backend.dto.CodePatchAnalysisResult;

public interface CodePatchAnalyzerService {
    CodePatchAnalysisResult analyzePatch(String rawDiff);
}
