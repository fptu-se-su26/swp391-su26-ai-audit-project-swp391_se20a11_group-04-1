package org.example.backend.service;

import org.example.backend.dto.CodePatchAnalysisResult;
import org.example.backend.dto.ReqDiffAlignmentResult;
import java.util.List;

public interface ReqDiffAlignmentService {
    ReqDiffAlignmentResult align(CodePatchAnalysisResult patchAnalysis, List<String> acceptanceCriteria);
}
